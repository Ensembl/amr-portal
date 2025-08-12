import 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'ens-text-button': {
        disabled?: boolean;
        style?: JSX.CSSProperties;
        class?: string;
        children?: any;
        onClick?: (event: MouseEvent) => void;
      };
      'ens-checkbox': {
        checked?: boolean;
        style?: JSX.CSSProperties;
        class?: string;
        onChange?: (event: Event) => void;
        children?: any;
        type?: "checkbox";
      };
      'ens-external-link': {
        href: string;
        children?: any;
      };
    }
  }
}