import { runContractSuite } from '../contract-suite';
import { createMockAdapter } from './index';

runContractSuite('mock adapter', () => createMockAdapter());
