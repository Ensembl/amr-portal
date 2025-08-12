import { Component } from "solid-js";

import './Checkbox.css';

const Checkbox: Component<{
    checked: boolean;
    onChange: (event: Event) => void;
    children: any;
    style?: any;
}> = (props) => {
    return (
        <label class="custom-checkbox" style={props.style}>
            <input type="checkbox" checked={props.checked} onChange={props.onChange} />
            <span class="custom-checkbox-label"></span>
            <span>{props.children}</span>
        </label>
    );
};

export default Checkbox;
