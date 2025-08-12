import { Component } from "solid-js"
import { AmrTableModalMode } from "./AmrTableContainer"
import SidebarButtons from "./SidebarButtons"
import Button from "../../elements/Button/Button"
import amrStore from "../../store/amrStore"

const DeleteModal: Component<{
    modalMode: AmrTableModalMode
    setModalMode: (mode: AmrTableModalMode) => void
    onCancel: () => void
}> = (props) => {
    const { modalMode, setModalMode, onCancel } = props
    const { clearAmrData } = amrStore

    const handleClear = () => {
        clearAmrData()
        onCancel()
    }

    return (
        <div class="delete-modal">
            <div class="delete-modal-body">
                <div class="delete-modal-content">
                    <p class="delete-modal-content-title">Clear all data</p>
                    <p class="delete-modal-content-message">Any configuration of the table will be lost if you clear the data - do you wish to continue?</p>
                </div>
                <div class="delete-modal-button-group">
                    <Button onClick={handleClear}>Clear</Button>
                    <ens-text-button class="delete-modal-cancel-button" onClick={onCancel}>Cancel</ens-text-button>
                </div>
            </div>
            <div class="sidebar-buttons">
                <SidebarButtons modalMode={modalMode} setModalMode={setModalMode} />
            </div>
        </div>
    )
}

export default DeleteModal
