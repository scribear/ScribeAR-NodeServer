interface UnnamedTestItem {
  [key: string]: unknown;
  name?: never;
  params?: never;
}

interface NamedTestItem {
  [key: string]: unknown;
  name: string;
}

interface UnnamedNestedTestItem {
  [key: string]: unknown;
  name?: never;
  params: unknown;
}

type TestItem = UnnamedTestItem | NamedTestItem | UnnamedNestedTestItem;

type FormattedTestItem<T> = T extends NamedTestItem ? [T['name'], Omit<T, 'name'>] : [string, T];

/**
 * Takes in an array of objects and returns an array of tuples
 * First element of tuple is the generated name of a test
 * Second element of tuple is the provided test parameters
 * If "name" parameter is provided, generated name is "name" and "name" is removed from parameters
 * If "params" parameter is provided and "name" is not provided, generated name is "params" and "params" is kept in parameters
 * Otherwise, name is JSON stringified version of given object and parameters are left unchanged
 * @param tests
 * @returns Formatted tuples
 */
export default function formatTestNames<T extends TestItem>(tests: Array<T>): Array<FormattedTestItem<T>> {
  return tests.map(t => {
    if (typeof t.name === 'string') {
      const {name, ...params} = t;
      return [name, params] as FormattedTestItem<T>;
    }

    if ('params' in t) {
      const {params, ...rest} = t;
      return [JSON.stringify(params), {params, ...rest}] as FormattedTestItem<T>;
    }

    return [JSON.stringify(t), t] as FormattedTestItem<T>;
  });
}
