/** @type {import('jest').Config} */
module.exports = {
  // Базовые настройки
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Расположение тестов
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/src/**/*.test.ts',
    '**/src/**/*.spec.ts'
  ],
  
  // Расширения файлов
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Файлы для предварительной загрузки
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],
  
  // Трансформация файлов
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  },
  
  // Модули, которые не нужно трансформировать
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$|uuid))'
  ],
  
  // Модули для автоматической загрузки
  setupFiles: [],
  
  // Глобальные переменные
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Количественные параметры
  maxWorkers: '50%',
  testTimeout: 10000,
  
  // Покрытие кода
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'cobertura'
  ],
  
  // Файлы для включения в покрытие
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/__tests__/**',
    '!src/**/__tests__/**'
  ],
  
  // Пороги покрытия
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Игнорирование файлов из покрытия
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Паттерны для поиска
  testRegex: [
    '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$'
  ],
  
  // Расширения модулей
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Алиасы модулей
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/__tests__/$1'
  },
  
  // Порядок выполнения
  testSequencer: '@jest/sequencer',
  
  // Вербальность
  verbose: true,
  
  // Очистка моков
  clearMocks: true,
  restoreMocks: true,
  
  // Автоматическая мокировка
  automock: false,
  
  // Следование симлинкам
  followSymlinks: true,
  
  // Расширенные настройки
  extensionsToTreatAsEsm: ['.ts'],
  
  // Обработчики ошибок
  errorOnDeprecated: true,
  
  // Файлы для watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // Триггеры для watch mode
  watchman: true,
  
  // Хуки
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Ресурсы
  resetMocks: false,
  restoreMocks: true,
  
  // Особые настройки для TypeScript
  resolver: undefined,
  
  // Файлы для pre-process
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        extends: './tsconfig.json',
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2020'
        }
      }
    }]
  }
};