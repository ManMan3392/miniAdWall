export interface FormField {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  enums?: Array<string | number>;
  min?: number;
  max?: number;
}

export interface FormConfig {
  formTitle?: string;
  fields?: FormField[];
}

export interface CreateAdInput {
  type_id: number;
  publisher: string;
  title: string;
  content: string;
  heat: number;
  price: number;
  landing_url: string;
  video_ids?: string | string[];
  ext_info?: Record<string, any>;
}
