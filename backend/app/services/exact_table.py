import re


def _member_table(page_content: str) -> tuple[list[str], list[list[str]]] | None:
    for section in re.split(r"(?=Table \d+:\n)", page_content):
        if not re.match(r"Table \d+:\n", section):
            continue

        lines = section.splitlines()[1:]
        rows = [
            [cell.strip() for cell in line.split(" | ")]
            for line in lines
            if " | " in line
        ]
        if len(rows) < 2:
            continue

        headers = [value.lower() for value in rows[0]]
        if any("age" in value or "उम्र" in value for value in headers):
            return headers, rows[1:]

    return None


def try_exact_answer(question: str, page_content: str) -> str | None:
    table = _member_table(page_content)
    if table is None:
        return None

    headers, rows = table
    age_index = next(
        index for index, header in enumerate(headers)
        if "age" in header or "उम्र" in header
    )
    q = question.casefold()

    age_limit = re.search(
        r"(?:under|below|less than|younger than|से कम|कम उम्र|chote|kam)"
        r"\s*(\d{1,3})|(\d{1,3})\s*(?:से कम|se kam|under)",
        q,
    )
    if age_limit:
        limit = int(age_limit.group(1) or age_limit.group(2))
        matching = []
        for row in rows:
            if len(row) <= age_index:
                continue
            age_match = re.search(r"\d{1,3}", row[age_index])
            if age_match and int(age_match.group()) < limit:
                matching.append(row)

        if not matching:
            return f"No members with a readable age below {limit} were found in the visible table."

        name_index = next(
            (i for i, h in enumerate(headers) if "name" in h or "नाम" in h),
            0,
        )
        names = [
            f"{row[name_index]} ({row[age_index]})"
            for row in matching
            if len(row) > max(name_index, age_index)
        ]
        return (
            f"The visible table contains {len(matching)} members under {limit}: "
            + ", ".join(names)
            + "."
        )

    wants_count = any(word in q for word in ("how many", "total", "count", "kitne", "कितने"))
    mentions_members = any(word in q for word in ("member", "सदस्य", "log", "लोग"))
    if wants_count and mentions_members:
        return f"The visible table on this page contains {len(rows)} members."

    return None

