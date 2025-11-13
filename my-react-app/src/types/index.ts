/**
 * Types cho Project và các components
 */

export type ComponentStatus = "pending" | "building" | "deployed" | "error";

export type ProjectStatus = "running" | "deploying" | "error" | "paused";

export type DatabaseItem = {
  id: string;
  name: string;
  type: "mysql" | "mongodb";
  provision: "user" | "system";
  endpoint?: string; // host:port
  username?: string;
  hasSeedZip?: boolean;
  status: ComponentStatus;
};

export type BackendItem = {
  id: string;
  name: string;
  tech: "spring" | "node";
  source: { kind: "zip" | "image"; ref: string }; // path hoặc repo:tag
  env?: Record<string, string>;
  dns?: string;
  version?: string;
  status: ComponentStatus;
  buildCommand?: string;
  outputDir?: string;
};

export type FrontendItem = {
  id: string;
  name: string;
  tech: "react" | "vue" | "angular";
  source: { kind: "zip" | "image"; ref: string };
  runtimeEnv?: Record<string, string>;
  publicUrl?: string;
  status: ComponentStatus;
  buildCommand?: string;
  outputDir?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  updatedAt: string; // ISO
  endpoints?: { label: string; url: string }[];
  components: {
    databases: DatabaseItem[];
    backends: BackendItem[];
    frontends: FrontendItem[];
  };
};

// Types cho wizard form
export type DatabaseFormData = {
  name: string;
  type: "mysql" | "mongodb";
  provision: "user" | "system";
  ip?: string;
  port?: string;
  username?: string;
  password?: string;
  seedZip?: File;
};

export type BackendFormData = {
  name: string;
  tech: "spring" | "node";
  sourceType: "zip" | "image";
  zipFile?: File;
  dockerImage?: string;
  env: Array<{ key: string; value: string }>;
  dns?: string;
  buildCommand?: string;
  outputDir?: string;
};

export type FrontendFormData = {
  name: string;
  tech: "react" | "vue" | "angular";
  sourceType: "zip" | "image";
  zipFile?: File;
  dockerImage?: string;
  runtimeEnv: Array<{ key: string; value: string }>;
  publicUrl?: string;
  buildCommand?: string;
  outputDir?: string;
};

export type WizardData = {
  projectName: string;
  description: string;
  databases: DatabaseFormData[];
  backends: BackendFormData[];
  frontends: FrontendFormData[];
  currentStep: number;
};

