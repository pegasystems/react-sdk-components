import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';

import { Utils } from '../../helpers/utils';

// FieldGroupList is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface FieldGroupListProps {
  // If any, enter additional props that only exist on this component
  items: any[] | any;
  onDelete: any;
  onAdd: any;
}

export default function FieldGroupList(props: FieldGroupListProps) {
  let menuIconOverride$ = 'trash';
  if (menuIconOverride$) {
    menuIconOverride$ = Utils.getImageSrc(menuIconOverride$, Utils.getSDKStaticConentUrl());
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
                  <img className='psdk-utility-card-action-svg-icon' src={menuIconOverride$} />
                </button>
              )}
              {item.children}
              <br />
              {props.onAdd && <Divider />}
              <br />
            </Grid>
          ))}
          {props.onAdd && (
            <Link onClick={props.onAdd} style={{ cursor: 'pointer' }} underline='hover'>
              +Add
            </Link>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
