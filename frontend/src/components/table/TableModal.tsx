import { Component } from "solid-js"
import { AmrTableModalMode } from "./AmrTableContainer"
import SidebarButtons from "./SidebarButtons"

const TableModal: Component<{
    modalMode: AmrTableModalMode
    setModalMode: (mode: AmrTableModalMode) => void
}> = (props) => {
    const { modalMode, setModalMode } = props

    return (
        <div class="table-modal">
            <SidebarButtons modalMode={modalMode} setModalMode={setModalMode} />
        </div>
    )
}

export default TableModal
