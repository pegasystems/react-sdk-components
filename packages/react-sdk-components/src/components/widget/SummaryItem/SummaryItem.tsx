import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Utils } from '../../helpers/utils';
import type { PConnProps } from '../../../types/PConnProps';

import './SummaryItem.css';

interface SummaryItemProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  menuIconOverride$: string;
  menuIconOverrideAction$: any;
  arItems$: any[] | any;
}

export default function SummaryItem(props: SummaryItemProps) {
  let imagePath$ = '';
  let menuIconOverride$;
  menuIconOverride$ = props.menuIconOverride$;
  imagePath$ = Utils.getIconPath(Utils.getSDKStaticConentUrl());
  const item = props.arItems$;
  const srcImg = `${imagePath$}${item.visual.icon}.svg`;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  if (menuIconOverride$) {
    menuIconOverride$ = Utils.getImageSrc(menuIconOverride$, Utils.getSDKStaticConentUrl());
  }

  function removeAttachment() {
    props.menuIconOverrideAction$(item);
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className='psdk-utility-card'>
      <div className='psdk-utility-card-icon'>
        <img className='psdk-utility-card-svg-icon' src={srcImg} />
      </div>
      <div className='psdk-utility-card-main'>
        {item.primary.type !== 'URL' && <div className='psdk-utility-card-main-primary-label'>{item.primary.name}</div>}
        {item.primary.type === 'URL' && (
          <div className='psdk-utility-card-main-primary-url'>
            <button type='button' className='psdk-utility-link-button'>
              {item.primary.name}&nbsp;
              <img className='psdk-utility-card-actions-svg-icon' src={`${imagePath$}${item.primary.icon}.svg`} />
            </button>
          </div>
        )}
        {item.secondary.text && <div style={{ color: item.secondary.error ? 'red' : undefined }}>{item.secondary.text}</div>}
      </div>
      <div className='psdk-utility-action'>
        {menuIconOverride$ && (
          <button type='button' className='psdk-utility-button' aria-label='Delete Attachment' onClick={removeAttachment}>
            <img className='psdk-utility-card-action-svg-icon' src={menuIconOverride$} />
          </button>
        )}
        {!menuIconOverride$ && (
          <div>
            <IconButton
              id='setting-button'
              aria-controls={open ? 'file-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup='true'
              onClick={handleClick}
              size='large'
            >
              <MoreVertIcon />
            </IconButton>
            <Menu id='file-menu' anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
              {item.actions &&
                item.actions.map((option) => (
                  <MenuItem style={{ fontSize: '14px' }} key={option.id || option.text} onClick={option.onClick}>
                    {option.text}
                  </MenuItem>
                ))}
            </Menu>
          </div>
        )}
      </div>
    </div>
  );
}
