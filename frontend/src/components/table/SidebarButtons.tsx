import { Component } from "solid-js"
import { AmrTableModalMode } from "./AmrTableContainer"
import DeleteIcon from "../../icons/DeleteIcon"
import DownloadIcon from "../../icons/DownloadIcon"
import TableIcon from "../../icons/TableIcon"
import amrStore from "../../store/amrStore"

const SidebarButtons: Component<{
    modalMode: AmrTableModalMode;
    setModalMode: (mode: AmrTableModalMode) => void;
}> = (props) => {
    const { modalMode, setModalMode } = props
    const { store } = amrStore
    const noDataAvailable = store.amrData.length === 0

    const getButtonColor = (mode: AmrTableModalMode) => {
        if ((mode === "delete" || mode === "download") && noDataAvailable) {
            return "#B7C0C8"
        }
        if (modalMode === mode) {
            return "#000000"
        }
        return "#0099FF"
    }

    return (
        <div class="sidebar-buttons-container">
            <button class="icon-button text-button" onClick={() => setModalMode('table')}>
                <TableIcon class="table-icon" fill={getButtonColor("table")} />
            </button>
            <button class="icon-button text-button" onClick={() => setModalMode('delete')} disabled={noDataAvailable}>
                <DeleteIcon class="table-icon" fill={getButtonColor("delete")} />
            </button>
            <button class="icon-button text-button" onClick={() => setModalMode('download')} disabled={noDataAvailable}>
                <DownloadIcon class="table-icon" fill={getButtonColor("download")} />
            </button>
        </div>
    )
}

export default SidebarButtons
