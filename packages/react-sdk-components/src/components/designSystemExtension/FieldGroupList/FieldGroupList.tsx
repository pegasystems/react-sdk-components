import React from 'react';

import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Link from '@material-ui/core/Link';

import { Utils } from '../../helpers/utils';

// FieldGroupList is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface FieldGroupListProps {
  // If any, enter additional props that only exist on this component
  items: Array<any> | any,
  onDelete: any,
  onAdd: any
}


export default function FieldGroupList(props: FieldGroupListProps) {
  let menuIconOverride$ = 'trash';
  if (menuIconOverride$) {
    menuIconOverride$ = Utils.getImageSrc(
      menuIconOverride$,
      Utils.getSDKStaticConentUrl()
    );
  }

  return (
    <Grid container spacing={4} justifyContent='space-between'>
      <Grid item style={{ width: '100%' }}>
        <Grid container spacing={1}>
          {props.items.map(item => (
            <Grid item style={{ width: '100%' }}>
              <b>{item.name}</b>
              {props.onDelete && (
                <button
                  type='button'
                  style={{ float: 'right' }}
                  className='psdk-utility-button'
                  id={`delete-row-${item.id}`}
                  aria-label='Delete Row'
                  onClick={() => {
                    props.onDelete(item.id);
                  }}
                >
                  <img className='psdk-utility-card-action-svg-icon' src={menuIconOverride$}></img>
                </button>
              )}
              {item.children}
              <br />
              {props.onAdd && <Divider />}
              <br />
            </Grid>
          ))}
          {props.onAdd && (
            <Link onClick={props.onAdd} style={{ cursor: 'pointer' }}>
              +Add
            </Link>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
