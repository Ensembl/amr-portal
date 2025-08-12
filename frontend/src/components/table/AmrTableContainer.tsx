import { createSignal, Match, Switch, type Component } from 'solid-js';

import '@ensembl/ensembl-elements-common/components/text-button/text-button';

import '@ensembl/ensembl-elements-common/components/table/sortable-column-header';
import '@ensembl/ensembl-elements-common/styles/custom-properties.css';
import '@ensembl/ensembl-elements-common/styles/resets.css';
import '@ensembl/ensembl-elements-common/styles/global.css';
import '@ensembl/ensembl-elements-common/styles/table.css';

import TableModal from './TableModal';

import DeleteModal from './DeleteModal';
import DownloadModal from './DownloadModal';
import amrStore from '../../store/amrStore';
import TableIcon from '../../icons/TableIcon';
import DeleteIcon from '../../icons/DeleteIcon';
import DownloadIcon from '../../icons/DownloadIcon';

import './AmrTableContainer.css';
import { AMRRecord, AMRRecordField, LinkData } from '../../types/amrRecord';

export type AmrTableModalMode = 'table' | 'delete' | 'download';

const AmrTableContainer: Component = () => {
  const [modalMode, setModalMode] = createSignal<AmrTableModalMode>('table');

  const { store } = amrStore;

  return (
    <div class="amr-container">
      <Switch>
        <Match when={modalMode() === 'table'}>
          <TableModal modalMode={modalMode()} setModalMode={setModalMode} />
        </Match>
        <Match when={modalMode() === 'delete'}>
          <DeleteModal
            modalMode={modalMode()}
            setModalMode={setModalMode}
            onCancel={() => setModalMode('table')}
          />
        </Match>
        <Match when={modalMode() === 'download'}>
          <DownloadModal
            modalMode={modalMode()}
            setModalMode={setModalMode}
            onCancel={() => setModalMode('table')}
          />
        </Match>
      </Switch>
      <div class="amr-body">
        <Switch>
          <Match
            when={
              !store.amrData ||
              !Array.isArray(store.amrData.data) ||
              store.amrData.data.length === 0
            }
          >
            <div class="no-data-container">
              <div class="no-data-item">
                <TableIcon fill="#000000" class="table-icon" />
                <span class="bold">Select data above</span>
              </div>
              <div class="no-data-item">
                <DeleteIcon fill="#B7C0C8" class="table-icon" />
                <span>Select to clear</span>
              </div>
              <div class="no-data-item">
                <DownloadIcon fill="#B7C0C8" class="table-icon" />
                <span>Select to download</span>
              </div>
            </div>
          </Match>
          <Match when={Array.isArray(store.amrData.data) && store.amrData.data.length > 0}>
            <AmrTable />
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const AmrTable: Component = () => {
  const { store } = amrStore;

  const getCells = (record: AMRRecord) => {
    const cells = record.map((field) => {
      let cellContent;

      if (isLink(field)) {
        cellContent = renderLink(field);
      } else {
        cellContent = field.value;
      }

      return <td>{cellContent}</td>;
    });
    return cells;
  };

  const isLink = (data: AMRRecordField): data is LinkData => {
    return data.type === 'link';
  };

  const renderLink = (data: LinkData) => {
    if (!data.value) {
      return null;
    } else if (!data.url) {
      return data.value;
    }

    return <ens-external-link href={data.url}>{data.value}</ens-external-link>;
  };

  return (
    <div class="amr-table-container">
      <table class="amr-table">
        <thead>
          <tr>
            {Object.entries([...store.amrData.data[0]]).map(([key, value]) => (
              <th>{value.column_id}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {store.amrData.data.map((item) => (
            <tr>{getCells(item)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AmrTableContainer;
