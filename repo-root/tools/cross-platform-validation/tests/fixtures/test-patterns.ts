/**
 * Test Fixtures - Known Pattern Examples
 * These fixtures provide ground truth for pattern matching tests
 */

export interface TestPatternFixture {
  code: string;
  expectedCategory: 'web' | 'native' | 'shared';
  expectedPatterns: string[];
  description: string;
  lineNumber: number;
}

export const WEB_PATTERN_FIXTURES: TestPatternFixture[] = [
  {
    code: 'const element = <div className="container">{children}</div>',
    expectedCategory: 'web',
    expectedPatterns: ['className', '<div'],
    description: 'JSX div with className',
    lineNumber: 1
  },
  {
    code: 'document.addEventListener("click", handleClick)',
    expectedCategory: 'web',
    expectedPatterns: ['document'],
    description: 'DOM event listener',
    lineNumber: 2
  },
  {
    code: 'const element = document.querySelector(".selector")',
    expectedCategory: 'web',
    expectedPatterns: ['document'],
    description: 'Document API usage',
    lineNumber: 3
  },
  {
    code: 'localStorage.setItem("key", "value")',
    expectedCategory: 'web',
    expectedPatterns: ['localStorage'],
    description: 'localStorage API',
    lineNumber: 4
  },
  {
    code: '<input type="text" onChange={handleChange} />',
    expectedCategory: 'web',
    expectedPatterns: ['<input', 'onChange'],
    description: 'HTML input with onChange',
    lineNumber: 5
  }
];

export const NATIVE_PATTERN_FIXTURES: TestPatternFixture[] = [
  {
    code: 'const styles = StyleSheet.create({ container: { flex: 1 } })',
    expectedCategory: 'native',
    expectedPatterns: ['StyleSheet'],
    description: 'StyleSheet.create usage',
    lineNumber: 10
  },
  {
    code: 'const platform = Platform.OS === "ios"',
    expectedCategory: 'native',
    expectedPatterns: ['Platform'],
    description: 'Platform.OS check',
    lineNumber: 11
  },
  {
    code: '<TouchableOpacity onPress={handlePress}></TouchableOpacity>',
    expectedCategory: 'native',
    expectedPatterns: ['<TouchableOpacity', 'onPress'],
    description: 'TouchableOpacity with onPress',
    lineNumber: 12
  },
  {
    code: 'AsyncStorage.getItem("key")',
    expectedCategory: 'native',
    expectedPatterns: ['AsyncStorage'],
    description: 'AsyncStorage API',
    lineNumber: 13
  },
  {
    code: 'const component = <View><Text>Hello</Text></View>',
    expectedCategory: 'native',
    expectedPatterns: ['<Text', '<View'],
    description: 'React Native components',
    lineNumber: 14
  }
];

export const SHARED_PATTERN_FIXTURES: TestPatternFixture[] = [
  {
    code: 'const [state, setState] = useState(initialValue)',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'React useState hook',
    lineNumber: 20
  },
  {
    code: 'interface Props { title: string; onPress?: () => void }',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'TypeScript interface',
    lineNumber: 21
  },
  {
    code: 'const result = items.map(item => item.id)',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'Array method',
    lineNumber: 22
  },
  {
    code: 'export function utility(input: string): string { return input.trim() }',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'Pure utility function',
    lineNumber: 23
  },
  {
    code: 'const memoizedValue = useMemo(() => expensiveCalculation(), [deps])',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'React useMemo hook',
    lineNumber: 24
  }
];

export const CONFLICT_PATTERN_FIXTURES: TestPatternFixture[] = [
  {
    code: '<div style={{ alignItems: "center" }} className="flex">',
    expectedCategory: 'web', // Web should win due to className
    expectedPatterns: ['className', '<div', 'alignItems'],
    description: 'Conflicting web (className) and native (alignItems) patterns',
    lineNumber: 30
  },
  {
    code: 'StyleSheet.create({ button: { backgroundColor: "#fff" } }) && document.body',
    expectedCategory: 'native', // Native should win due to StyleSheet
    expectedPatterns: ['StyleSheet', 'document'],
    description: 'Conflicting native (StyleSheet) and web (document) patterns',
    lineNumber: 31
  }
];

export const EDGE_CASE_FIXTURES: TestPatternFixture[] = [
  {
    code: '// className="comment" - this is just a comment',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'Pattern in comment should be ignored',
    lineNumber: 40
  },
  {
    code: 'const str = "className=\\"fake\\""; // String literal',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'Pattern in string literal should be ignored',
    lineNumber: 41
  },
  {
    code: '',
    expectedCategory: 'shared',
    expectedPatterns: [],
    description: 'Empty line',
    lineNumber: 42
  }
];

export const ALL_FIXTURES = [
  ...WEB_PATTERN_FIXTURES,
  ...NATIVE_PATTERN_FIXTURES,
  ...SHARED_PATTERN_FIXTURES,
  ...CONFLICT_PATTERN_FIXTURES,
  ...EDGE_CASE_FIXTURES
];