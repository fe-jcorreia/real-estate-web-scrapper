export interface ForceUpdatePlatform {
  latest?: number;
  required?: number;
}

export interface ForceUpdate {
  android?: ForceUpdatePlatform;
  ios?: ForceUpdatePlatform;
}

export interface Settings {
  forceUpdate?: ForceUpdate;
}
