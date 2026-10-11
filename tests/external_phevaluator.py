"""Compare pkr showdown winners to independently packaged PH Evaluator.

This test runs only in CI, with phevaluator pinned to 0.6.0. It is never
bundled into the public site or executed during user sessions.
"""
import json
import sys
from phevaluator.evaluator import evaluate_cards


def main() -> None:
    with open(sys.argv[1], encoding='utf-8') as f:
        scenarios = json.load(f)['cases']
    for index, scenario in enumerate(scenarios):
        board = scenario['board']
        ranks = [evaluate_cards(*(hole + board)) for hole in scenario['hands']]
        strongest = min(ranks)  # PH rank 1 is strongest, opposite to pkr.
        winners = [r == strongest for r in ranks]
        if winners != scenario['winners']:
            raise AssertionError(f"External PH evaluator mismatch in scenario {index}: "
                                 f"board={board}, hands={scenario['hands']}, "
                                 f"pkr={scenario['winners']}, ph={winners}")
    print(f"PASS: {len(scenarios)} independently evaluated showdowns (PH Evaluator 0.6.0)")


if __name__ == '__main__':
    main()
