export interface FormConfigModalProps {
  visible: boolean;
  onClose: () => void;
  typeCode: string;
  typeName: string;
}

export interface FieldConfig {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  enums?: string[];
  validation?: {
    required?: boolean;
    type?: string;
    message?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}
