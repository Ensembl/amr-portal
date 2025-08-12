import { Component } from 'solid-js';
import './Button.css';

const Button: Component<{
  onClick: () => void;
  children: any;
}> = (props) => {
  return (
    <button class="custom-button" onClick={props.onClick}>
      {props.children}
    </button>
  );
};

export default Button;
