export interface UseCase {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface DownloadInfo {
  url: string;
  version: string;
  platform: string;
  requirements: string[];
}
