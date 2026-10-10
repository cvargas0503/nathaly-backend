/** Composable SQL fragments: interpolated values always become bound parameters. */
export class SqlQuery {
  constructor(readonly text: string, readonly parameters: unknown[] = []) {}

  replace(search: string, replacement: string): SqlQuery {
    return new SqlQuery(this.text.replace(search, replacement), this.parameters);
  }

  toQuery(): [string, unknown[]] {
    return [this.text, this.parameters];
  }
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlQuery {
  const parameters: unknown[] = [];
  let text = strings[0];
  values.forEach((value, index) => {
    if (value instanceof SqlQuery) {
      const offset = parameters.length;
      text += value.text.replace(/@(\d+)\b/g, (_, number) => `@${Number(number) + offset}`);
      parameters.push(...value.parameters);
    } else {
      text += `@${parameters.length}`;
      parameters.push(value);
    }
    text += strings[index + 1];
  });
  return new SqlQuery(text, parameters);
}

export function sqlJoin(queries: SqlQuery[]): SqlQuery {
  return queries.reduce((combined, query, index) =>
    index === 0 ? query : sql`${combined} UNION ALL ${query}`, sql``);
}
