from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.dataset import EvaluationDataset
from deepeval.metrics import GEval, SummarizationMetric
from dotenv import load_dotenv
import requests
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../python/utils')))
from essay import get_essays


ESSAY_SEARCH_API_URL="http://localhost:3000/api"
GOLDENS_FILE="./tests/python/data/goldens/summary_goldens.json"

def summarize(essay):
    response = requests.post(
        ESSAY_SEARCH_API_URL + "/summarize",
        headers={
            'Authorization': f'Bearer {os.environ.get("OLLAMA_API_KEY")}',
        },
        json={
            "query": essay
        }
    )
    return response.text

def test_case():
    load_dotenv(".env.local")
    dataset = EvaluationDataset()
    essays = get_essays(10)

    print(f"Generating outputs")
    for index, essay in enumerate(essays):
        print(f"Processing item {index + 1}/{len(essays)}")
        input = essay
        test_case = LLMTestCase(input=input, actual_output=summarize(essay))
        dataset.test_cases.append(test_case)

    concision_metric = GEval(
        name="Concision",
        criteria="Assess if the actual output remains concise while preserving all essential information.",
        evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT],
    )
    completeness_metric = GEval(
        name="Completeness",
        criteria="Assess whether the actual output retains all key information from the input.",
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
    )
    summarization_metric = SummarizationMetric(
        threshold=0.5
    )

    dataset.evaluate(
        metrics=[concision_metric, completeness_metric, summarization_metric]
    )