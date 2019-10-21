import * as React from 'react';

import 'devextreme/data/odata/store';
import DataGrid, { Column, RemoteOperations, Paging, Pager } from 'devextreme-react/data-grid';
import CustomStore from 'devextreme/data/custom_store';
import 'whatwg-fetch';

const dataSource = {
    store: new CustomStore({
        load: function (loadOptions) {
            let params = '?';

            params += `skip=${loadOptions.skip}`;
            params += `&take=${loadOptions.take}`;

            if (loadOptions.sort) {
                params += `&orderby=${loadOptions.sort[0].selector}`;
                if (loadOptions.sort[0].desc) {
                    params += ' desc';
                }
            }
            return fetch(`https://js.devexpress.com/Demos/WidgetsGallery/data/orderItems${params}`)
                .then(response => response.json())
                .then((data) => {
                    return {
                        data: data.items,
                        totalCount: data.totalCount
                    };
                })
                .catch(() => { throw 'Data Loading Error'; });
        }
    })
};

export interface DataGridProps {

}

export function getDataGridElement(props: DataGridProps): JSX.Element {
    return (

        <DataGrid
            dataSource={dataSource}
            showBorders={true}
        >
            <Column dataField={'OrderNumber'} />
            <Column dataField={'OrderDate'} />
            <Column dataField={'StoreCity'} />
            <Column dataField={'StoreState'} />
            <Column dataField={'Employee'} />
            <Column dataField={'SaleAmount'}
                format={'currency'}
            />
            <RemoteOperations
                sorting={true}
                paging={true}
            />
            <Paging defaultPageSize={12} />
            <Pager
                showPageSizeSelector={true}
                allowedPageSizes={[8, 12, 20]}
            />
        </DataGrid>
    );
}


export default getDataGridElement;