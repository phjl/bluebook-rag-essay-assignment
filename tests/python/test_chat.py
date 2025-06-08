from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.dataset import EvaluationDataset
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric
from dotenv import load_dotenv
import requests
import os

ESSAY_SEARCH_API_URL = "http://localhost:3000/api"
GOLDENS_FILE = "./tests/python/data/goldens/chat_goldens.json"


def get_chat_completion(question):
    print(f"Generating chat completion for question: \"{question}\"")
    response = requests.post(
        ESSAY_SEARCH_API_URL + "/chat",
        headers={
            'Authorization': f'Bearer {os.environ.get("OLLAMA_API_KEY")}',
        },
        json={
            "messages": {'role': 'user', 'content': question}
        }
    )
    return response.text


def test_case():
    load_dotenv(".env.local")
    golden_dataset = EvaluationDataset()
    golden_dataset.add_goldens_from_json_file(
        GOLDENS_FILE,
        input_key_name="input",
        expected_output_key_name="expected_output",
        context_key_name="context"
    )

    # Create test cases from golden questions/answers
    test_dataset = EvaluationDataset()
    print(f"Generating outputs")
    for index, golden in enumerate(golden_dataset.goldens):
        print(f"Processing item {index + 1}/{len(golden_dataset.goldens)}")
        input = golden.input
        test_case = LLMTestCase(
            input=input,
            retrieval_context=golden.context,
            actual_output=get_chat_completion(input)
        )
        test_dataset.add_test_case(test_case)

    # Checks how relevant the answer is to the question
    answer_relevancy_metric = AnswerRelevancyMetric(
        threshold=0.7,
        include_reason=True
    )
    # Checks how much the answer adheres to the provided context
    faithfulness_metric = FaithfulnessMetric(
        threshold=0.7,
        include_reason=True,
    )
    test_dataset.evaluate(
        metrics=[answer_relevancy_metric]
    )
