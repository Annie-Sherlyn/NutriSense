"""
Unit tests for CLI runner.
Verifies argument parsing, scenario file execution, and JSON output formatting.
"""

import sys
import subprocess
from pathlib import Path

def test_cli_execution_with_scenario_1():
    root_dir = Path(__file__).resolve().parent.parent.parent
    scenario_path = root_dir / "budget_recommendation_service" / "data" / "scenarios" / "scenario_1_general.json"

    cmd = [
        sys.executable,
        "-m", "budget_recommendation_service.cli",
        "--input", str(scenario_path),
        "--json"
    ]

    res = subprocess.run(cmd, cwd=str(root_dir), capture_output=True, text=True, encoding="utf-8")
    assert res.returncode == 0
    assert '"status": "success"' in res.stdout
    assert '"mode": "general"' in res.stdout
    assert '"recommendations":' in res.stdout

def test_cli_execution_default():
    root_dir = Path(__file__).resolve().parent.parent.parent

    cmd = [
        sys.executable,
        "-m", "budget_recommendation_service.cli",
        "--json"
    ]

    res = subprocess.run(cmd, cwd=str(root_dir), capture_output=True, text=True, encoding="utf-8")
    assert res.returncode == 0
    assert '"status": "success"' in res.stdout
