from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from . import elevenlabs, featherless
from .experiments import (
    Experiment,
    ExperimentSummary,
    Step,
    load_all,
    load_one,
)

app = FastAPI(title="AI Lab Companion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- experiments ----------


@app.get("/experiments", response_model=list[ExperimentSummary])
def list_experiments():
    return [
        ExperimentSummary(
            id=e.id,
            title=e.title,
            summary=e.summary,
            grade_level=e.grade_level,
            duration_minutes=e.duration_minutes,
        )
        for e in load_all()
    ]


@app.get("/experiments/{experiment_id}", response_model=Experiment)
def get_experiment(experiment_id: str):
    exp = load_one(experiment_id)
    if exp is None:
        raise HTTPException(status_code=404, detail="experiment not found")
    return exp


def _get_step(experiment_id: str, step_id: str) -> tuple[Experiment, Step]:
    exp = load_one(experiment_id)
    if exp is None:
        raise HTTPException(status_code=404, detail="experiment not found")
    for s in exp.steps:
        if s.id == step_id:
            return exp, s
    raise HTTPException(status_code=404, detail="step not found")


# ---------- M2: Simulation Lab tutor ----------


class TutorMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class TutorRequest(BaseModel):
    experiment_id: str
    step_id: str
    messages: list[TutorMessage] = Field(default_factory=list)


class TutorResponse(BaseModel):
    reply: str


def _tutor_system_prompt(exp: Experiment, step: Step) -> str:
    sim = step.simulation
    if sim is None:
        observation = "(no simulated observation defined for this step)"
        prompts = "(no tutor prompts defined for this step)"
    else:
        observation = sim.observation
        prompts = "\n".join(f"- {p}" for p in sim.tutor_prompts)
    return (
        "You are a patient high-school science tutor running a virtual Simulation Lab. "
        f"The student is doing the experiment: \"{exp.title}\". "
        f"They are on step \"{step.id}\": {step.instruction}\n\n"
        f"What the student would observe at this step: {observation}\n\n"
        "Useful Socratic prompts you may draw from (do not list them verbatim):\n"
        f"{prompts}\n\n"
        "Guide the student with short Socratic questions. Never give the answer outright. "
        "Keep replies to 1-3 sentences. When the student shows understanding, end your "
        "reply with the exact tag [READY_FOR_NEXT_STEP] on its own line."
    )


@app.post("/tutor/chat", response_model=TutorResponse)
async def tutor_chat(req: TutorRequest):
    exp, step = _get_step(req.experiment_id, req.step_id)
    messages: list[dict] = [{"role": "system", "content": _tutor_system_prompt(exp, step)}]
    if not req.messages:
        # Open the conversation with the step's observation framing.
        opener = (
            step.simulation.observation
            if step.simulation
            else step.instruction
        )
        messages.append(
            {
                "role": "user",
                "content": f"I'm starting this step. {opener}",
            }
        )
    else:
        for m in req.messages:
            messages.append({"role": m.role, "content": m.content})
    reply = await featherless.chat(messages)
    return TutorResponse(reply=reply)


# ---------- M3: TTS ----------


class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None


@app.post("/tts")
async def tts(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is empty")
    audio = await elevenlabs.synthesize(req.text, voice_id=req.voice_id)
    return Response(content=audio, media_type="audio/mpeg")


# ---------- M4: Real Lab Guide vision checkpoint ----------


class CheckpointRequest(BaseModel):
    experiment_id: str
    step_id: str
    image_b64: str = Field(..., description="JPEG bytes, base64-encoded, no data: prefix.")


class CheckpointResponse(BaseModel):
    passed: bool
    observations: str
    hint: Optional[str] = None


def _vision_user_prompt(step: Step) -> str:
    cp = step.checkpoint
    if cp is None:
        return "Describe the image briefly."
    criteria = "\n".join(f"- {c}" for c in cp.success_criteria)
    return (
        f"You are verifying a student's lab setup at step \"{step.id}\".\n"
        f"Expected scene: {cp.expected_state}\n"
        "Success criteria (ALL must be true to pass):\n"
        f"{criteria}\n\n"
        "Respond with ONLY a JSON object of the form:\n"
        "{\"passed\": <true|false>, \"observations\": \"<1-2 sentence description of what you see>\"}\n"
        "Do not include any other text."
    )


@app.post("/vision/checkpoint", response_model=CheckpointResponse)
async def vision_checkpoint(req: CheckpointRequest):
    exp, step = _get_step(req.experiment_id, req.step_id)
    if step.checkpoint is None:
        raise HTTPException(
            status_code=400, detail="this step has no checkpoint defined"
        )
    system = (
        "You are a careful but encouraging lab safety verifier. "
        "You judge a webcam image against a list of success criteria. "
        "Be lenient about lighting and angle, strict about the actual physical state."
    )
    result = await featherless.vision_verify(
        req.image_b64, system_prompt=system, user_prompt=_vision_user_prompt(step)
    )
    passed = bool(result.get("passed", False))
    observations = str(result.get("observations", "")).strip() or "No description."
    hint = None
    if not passed and step.checkpoint.failure_hints:
        hint = step.checkpoint.failure_hints[0]
    return CheckpointResponse(passed=passed, observations=observations, hint=hint)


# ---------- M5: voice loop — compose transition narration ----------


class TransitionRequest(BaseModel):
    experiment_id: str
    current_step_id: Optional[str] = None
    next_step_id: str
    verification_observations: Optional[str] = None


class TransitionResponse(BaseModel):
    narration: str


@app.post("/tutor/transition", response_model=TransitionResponse)
async def tutor_transition(req: TransitionRequest):
    exp = load_one(req.experiment_id)
    if exp is None:
        raise HTTPException(status_code=404, detail="experiment not found")
    next_step = next((s for s in exp.steps if s.id == req.next_step_id), None)
    if next_step is None:
        raise HTTPException(status_code=404, detail="next_step not found")

    obs = req.verification_observations or "(no prior verification)"
    system = (
        "You are a friendly voice lab assistant for a high-school student. "
        "Given a confirmation of the previous step and the next instruction, "
        "produce ONE short spoken sentence (max 25 words) that briefly affirms the "
        "previous result and then tells the student exactly what to do next. "
        "Plain prose, no markdown, no preamble."
    )
    user = (
        f"Experiment: {exp.title}\n"
        f"Previous verification observed: {obs}\n"
        f"Next step instruction: {next_step.instruction}\n"
        "Write the spoken sentence now."
    )
    narration = await featherless.chat(
        [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=120,
        temperature=0.5,
    )
    # Strip any accidental markdown / quoting
    narration = narration.strip().strip('"').strip()
    return TransitionResponse(narration=narration)
