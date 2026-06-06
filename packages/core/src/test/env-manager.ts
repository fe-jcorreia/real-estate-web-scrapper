export class EnvManager {
  private oldValues: Record<string, string | undefined> = {};

  set<T>(key: string, value: T): void {
    this.oldValues[key] = process.env[key];

    if (typeof value === 'string') {
      process.env[key] = value;
    } else {
      process.env[key] = JSON.stringify(value);
    }
  }

  restoreAll(): void {
    Object.entries(this.oldValues).forEach(([key, value]) => {
      process.env[key] = value;
    });
    this.oldValues = {};
  }
}
