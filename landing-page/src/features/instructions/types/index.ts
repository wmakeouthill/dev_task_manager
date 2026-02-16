export interface InstructionStep {
  id: string;
  step: number;
  title: string;
  description: string;
  imageAlt: string;
  imageSrc?: string;
  mediaType: 'image' | 'video';
}
