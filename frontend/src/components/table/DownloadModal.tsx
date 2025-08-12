import { Component } from "solid-js"
import SidebarButtons from "./SidebarButtons"
import { AmrTableModalMode } from "./AmrTableContainer"

const DownloadModal: Component<{
    modalMode: AmrTableModalMode
    setModalMode: (mode: AmrTableModalMode) => void
    onCancel: () => void
}> = (props) => {
    const { modalMode, setModalMode, onCancel } = props

    return (
        <div class="download-modal">
            <div class="download-modal-body">
                <div class="download-modal-content">
                    <p class="download-modal-content-title">Download data</p>
                    <div class="download-modal-content-body">
                        <label class="download-modal-checkbox-label"><input type="checkbox" disabled /> Downloadable data</label>
                        <label class="download-modal-checkbox-label"><input type="checkbox" disabled /> Data shown in table</label>
                    </div>
                </div>
                <div class="download-modal-button-group">
                    <button disabled>Download</button>
                    <ens-text-button class="download-modal-cancel-button" onClick={onCancel}>Cancel</ens-text-button>
                </div>
            </div>
            <div class="sidebar-buttons">
                <SidebarButtons modalMode={modalMode} setModalMode={setModalMode} />
            </div>
        </div>
    )
}

export default DownloadModal