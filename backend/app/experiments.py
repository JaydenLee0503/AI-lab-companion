from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field, model_validator


# Experiments live at the repo root so both modes share the same files.
# backend/app/experiments.py -> repo root is two parents up.
EXPERIMENTS_DIR = Path(__file__).resolve().parent.parent.parent / "experiments"


class Material(BaseModel):
    name: str
    quantity: str
    notes: Optional[str] = None


class Checkpoint(BaseModel):
    """Real Lab Guide: what the VLM should verify from one webcam frame."""

    expected_state: str = Field(
        ..., description="Plain-English description of the scene the VLM should see."
    )
    success_criteria: list[str] = Field(
        ..., min_length=1, description="Specific things the VLM must confirm."
    )
    failure_hints: list[str] = Field(
        default_factory=list,
        description="Coaching lines to speak back to the student if a criterion fails.",
    )


class Simulation(BaseModel):
    """Simulation Lab: what the LLM tutor presents and asks at this step."""

    observation: str = Field(
        ..., description="What the student would observe if doing the real experiment."
    )
    tutor_prompts: list[str] = Field(
        ..., min_length=1, description="Socratic questions for the LLM to draw from."
    )


class Step(BaseModel):
    id: str
    instruction: str
    checkpoint: Optional[Checkpoint] = None
    simulation: Optional[Simulation] = None

    @model_validator(mode="after")
    def _at_least_one_mode(self) -> "Step":
        if self.checkpoint is None and self.simulation is None:
            raise ValueError(
                f"step '{self.id}' must define checkpoint, simulation, or both"
            )
        return self


class Experiment(BaseModel):
    id: str
    title: str
    summary: str
    grade_level: str
    duration_minutes: int = Field(..., gt=0)
    learning_goals: list[str] = Field(..., min_length=1)
    materials: list[Material] = Field(..., min_length=1)
    safety: list[str] = Field(default_factory=list)
    steps: list[Step] = Field(..., min_length=1)
    reflection: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _unique_step_ids(self) -> "Experiment":
        seen: set[str] = set()
        for s in self.steps:
            if s.id in seen:
                raise ValueError(f"duplicate step id '{s.id}'")
            seen.add(s.id)
        return self


class ExperimentSummary(BaseModel):
    id: str
    title: str
    summary: str
    grade_level: str
    duration_minutes: int


def _load_file(path: Path) -> Experiment:
    with path.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    exp = Experiment.model_validate(raw)
    if exp.id != path.stem:
        raise ValueError(
            f"experiment id '{exp.id}' does not match filename '{path.stem}'"
        )
    return exp


def load_all() -> list[Experiment]:
    if not EXPERIMENTS_DIR.exists():
        return []
    out: list[Experiment] = []
    for p in sorted(EXPERIMENTS_DIR.glob("*.json")):
        out.append(_load_file(p))
    return out


def load_one(experiment_id: str) -> Optional[Experiment]:
    path = EXPERIMENTS_DIR / f"{experiment_id}.json"
    if not path.exists():
        return None
    return _load_file(path)
