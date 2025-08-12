import { Component } from "solid-js";

import './ShadedInput.css'

const ShadedInput: Component<{
    placeholder: string;
    value: string;
    onInput: (value: string) => void;
    style?: any;
}> = (props) => {
    return (
        <input
            name="find"
            type="text"
            placeholder={props.placeholder}
            class="shaded-input"
            value={props.value}
            style={props.style}
            onInput={(e) => props.onInput(e.currentTarget.value)}
        />
    )
}

export default ShadedInput
