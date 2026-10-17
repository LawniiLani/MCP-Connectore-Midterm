#!/usr/bin/env python3
"""Print the Fibonacci sequence up to n (all terms <= n)."""

import sys


def fibonacci_up_to(n):
    """Return a list of Fibonacci numbers that are <= n."""
    sequence = []
    a, b = 0, 1
    while a <= n:
        sequence.append(a)
        a, b = b, a + b
    return sequence


def main():
    if len(sys.argv) > 1:
        raw = sys.argv[1]
    else:
        raw = input("Print Fibonacci numbers up to n. Enter n: ")

    try:
        n = int(raw)
    except ValueError:
        print(f"Error: '{raw}' is not a valid integer.")
        sys.exit(1)

    if n < 0:
        print("Error: n must be a non-negative integer.")
        sys.exit(1)

    print(" ".join(str(x) for x in fibonacci_up_to(n)))


if __name__ == "__main__":
    main()
