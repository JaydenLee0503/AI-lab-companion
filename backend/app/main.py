from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .experiments import Experiment, ExperimentSummary, load_all, load_one

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
