import {
  DateUtils,
  NumberUtils,
  StringUtils,
  ValidationUtils,
  AsyncUtils,
  ObjectUtils,
  ArrayUtils,
  ApiUtils,
  LogUtils,
} from '../../utils';

/**
 * Тесты для утилит
 */
describe('DateUtils', () => {
  describe('formatLocal', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = DateUtils.formatLocal(date, 'ru-RU');
      
      expect(formatted).toContain('25 декабря 2023');
      expect(formatted).toContain('10:30');
    });
  });

  describe('getAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date('1990-01-01');
      const age = DateUtils.getAge(birthDate);
      
      expect(typeof age).toBe('number');
      expect(age).toBeGreaterThan(0);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      expect(DateUtils.isPastDate(pastDate)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01');
      expect(DateUtils.isPastDate(futureDate)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2023-12-25');
      const newDate = DateUtils.addDays(date, 10);
      
      expect(newDate.getDate()).toBe(4); // 25 + 10 = 35, но в новом месяце
      expect(newDate.getMonth()).toBe(0); // Январь
    });
  });

  describe('differenceInDays', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2023-12-25');
      const date2 = new Date('2023-12-31');
      const diff = DateUtils.differenceInDays(date1, date2);
      
      expect(diff).toBe(6);
    });
  });
});

describe('NumberUtils', () => {
  describe('formatNumber', () => {
    it('should format number with thousand separator', () => {
      const number = 1234567.89;
      const formatted = NumberUtils.formatNumber(number, 'ru-RU');
      
      expect(formatted).toContain(' ');
      expect(formatted).toContain(',');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const amount = 1234.56;
      const formatted = NumberUtils.formatCurrency(amount, 'USD', 'en-US');
      
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('round', () => {
    it('should round number to specified decimals', () => {
      const number = 123.456789;
      const rounded = NumberUtils.round(number, 2);
      
      expect(rounded).toBe(123.46);
    });
  });

  describe('inRange', () => {
    it('should check if number is in range', () => {
      expect(NumberUtils.inRange(5, 1, 10)).toBe(true);
      expect(NumberUtils.inRange(15, 1, 10)).toBe(false);
    });
  });

  describe('randomInRange', () => {
    it('should generate random number in range', () => {
      const random = NumberUtils.randomInRange(1, 10);
      
      expect(random).toBeGreaterThanOrEqual(1);
      expect(random).toBeLessThanOrEqual(10);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = NumberUtils.calculatePercentage(100, 25);
      expect(result).toBe(25);
    });
  });
});

describe('StringUtils', () => {
  describe('generateSlug', () => {
    it('should generate slug from string', () => {
      const text = 'Hello World! This is a test.';
      const slug = StringUtils.generateSlug(text);
      
      expect(slug).toBe('hello-world-this-is-a-test');
      expect(slug).toHaveLength(25); // Должно быть обрезано до 50 символов
    });
  });

  describe('truncate', () => {
    it('should truncate long string', () => {
      const text = 'This is a very long string that should be truncated';
      const truncated = StringUtils.truncate(text, 20);
      
      expect(truncated).toHaveLength(23); // 20 + '...'
      expect(truncated).toContain('...');
    });

    it('should not truncate short string', () => {
      const text = 'Short';
      const truncated = StringUtils.truncate(text, 20);
      
      expect(truncated).toBe(text);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      const text = 'hello world';
      const capitalized = StringUtils.capitalize(text);
      
      expect(capitalized).toBe('Hello world');
    });
  });

  describe('isPalindrome', () => {
    it('should detect palindrome', () => {
      expect(StringUtils.isPalindrome('A man a plan a canal Panama')).toBe(true);
      expect(StringUtils.isPalindrome('racecar')).toBe(true);
      expect(StringUtils.isPalindrome('hello')).toBe(false);
    });
  });

  describe('stripHtml', () => {
    it('should strip HTML tags', () => {
      const html = '<p>Hello <b>world</b>!</p>';
      const text = StringUtils.stripHtml(html);
      
      expect(text).toBe('Hello world!');
    });
  });
});

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    it('should validate email correctly', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(ValidationUtils.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate phone correctly', () => {
      expect(ValidationUtils.isValidPhone('+1234567890')).toBe(true);
      expect(ValidationUtils.isValidPhone('123')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate URL correctly', () => {
      expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true);
      expect(ValidationUtils.isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate password strength', () => {
      const strongPassword = 'StrongPassword123!';
      const result = ValidationUtils.validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toHaveLength(0);
    });

    it('should detect weak password', () => {
      const weakPassword = '123';
      const result = ValidationUtils.validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });
});

describe('AsyncUtils', () => {
  describe('delay', () => {
    it('should delay execution', async () => {
      const startTime = Date.now();
      
      await AsyncUtils.delay(100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry failed operation', async () => {
      let attempts = 0;
      const mockFn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'Success';
      });

      const result = await AsyncUtils.retryWithBackoff(mockFn, 3, 10);
      
      expect(result).toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(AsyncUtils.retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('pool', () => {
    it('should execute tasks with concurrency limit', async () => {
      const tasks = Array.from({ length: 6 }, (_, i) => 
        () => AsyncUtils.delay(50).then(() => i)
      );
      
      const results = await AsyncUtils.pool(tasks, 3);
      
      expect(results).toHaveLength(6);
      expect(results).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('withTimeout', () => {
    it('should timeout long running operation', async () => {
      const longRunningTask = AsyncUtils.delay(200).then(() => 'Done');
      
      await expect(AsyncUtils.withTimeout(longRunningTask, 100)).rejects.toThrow();
    });

    it('should complete fast operation', async () => {
      const fastTask = Promise.resolve('Done');
      
      const result = await AsyncUtils.withTimeout(fastTask, 100);
      
      expect(result).toBe('Done');
    });
  });
});

describe('ObjectUtils', () => {
  describe('deepClone', () => {
    it('should deep clone object', () => {
      const original = {
        name: 'Test',
        nested: { value: 42 },
        array: [1, 2, { deep: 'value' }]
      };
      
      const cloned = ObjectUtils.deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.array[2]).not.toBe(original.array[2]);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      
      const result = ObjectUtils.deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('isEmpty', () => {
    it('should check if object is empty', () => {
      expect(ObjectUtils.isEmpty({})).toBe(true);
      expect(ObjectUtils.isEmpty({ a: 1 })).toBe(false);
      expect(ObjectUtils.isEmpty(null)).toBe(true);
      expect(ObjectUtils.isEmpty(undefined)).toBe(true);
    });
  });

  describe('get', () => {
    it('should get nested value', () => {
      const obj = { a: { b: { c: 'value' } } };
      
      expect(ObjectUtils.get(obj, 'a.b.c')).toBe('value');
      expect(ObjectUtils.get(obj, 'a.b.d', 'default')).toBe('default');
    });
  });
});

describe('ArrayUtils', () => {
  describe('unique', () => {
    it('should remove duplicates', () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const unique = ArrayUtils.unique(array);
      
      expect(unique).toEqual([1, 2, 3, 4]);
    });
  });

  describe('groupBy', () => {
    it('should group array items', () => {
      const array = [
        { type: 'fruit', name: 'apple' },
        { type: 'fruit', name: 'banana' },
        { type: 'vegetable', name: 'carrot' }
      ];
      
      const grouped = ArrayUtils.groupBy(array, item => item.type);
      
      expect(grouped.fruit).toHaveLength(2);
      expect(grouped.vegetable).toHaveLength(1);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = ArrayUtils.shuffle(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const chunks = ArrayUtils.chunk(array, 3);
      
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual([1, 2, 3]);
      expect(chunks[2]).toEqual([7]);
    });
  });

  describe('findWhere', () => {
    it('should find item by condition', () => {
      const array = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 }
      ];
      
      const found = ArrayUtils.findWhere(array, item => item.age > 27);
      
      expect(found?.name).toBe('Jane');
    });
  });
});

describe('ApiUtils', () => {
  describe('success', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'Test' };
      const response = ApiUtils.success(data, 'Success message');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Success message');
      expect(response.timestamp).toBeDefined();
      expect(response.requestId).toBeDefined();
    });
  });

  describe('error', () => {
    it('should create error response', () => {
      const response = ApiUtils.error('Error message', 'ValidationError');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('ValidationError');
      expect(response.message).toBe('Error message');
      expect(response.timestamp).toBeDefined();
      expect(response.requestId).toBeDefined();
    });
  });

  describe('validationError', () => {
    it('should create validation error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ];
      
      const response = ApiUtils.validationError(errors);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Validation Error');
      expect(response.data.validationErrors).toEqual(errors);
    });
  });
});

describe('LogUtils', () => {
  describe('formatLogMessage', () => {
    it('should format log message', () => {
      const message = 'Test log message';
      const meta = { userId: '123' };
      
      const formatted = LogUtils.formatLogMessage('info', message, meta);
      
      expect(formatted).toContain('INFO');
      expect(formatted).toContain(message);
      expect(formatted).toContain(JSON.stringify(meta));
    });
  });

  describe('sanitizeForLogging', () => {
    it('should sanitize sensitive data', () => {
      const obj = {
        name: 'John',
        password: 'secret',
        token: 'abc123',
        email: 'john@example.com'
      };
      
      const sanitized = LogUtils.sanitizeForLogging(obj);
      
      expect(sanitized.name).toBe('John');
      expect(sanitized.password).toBe('***');
      expect(sanitized.token).toBe('***');
      expect(sanitized.email).toBe('john@example.com');
    });
  });
});