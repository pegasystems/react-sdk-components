import { useState } from 'react';
import styled from 'styled-components';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Utils } from '../../helpers/utils';
import type { PConnProps } from '../../../types/PConnProps';

// ---------------------------------------------------------------------------
// Styled-components — replaces SummaryItem.css class-based styles.
// MUI components (IconButton, Menu, MenuItem) keep their own emotion-based
// styling, demonstrating cross-compatibility between the two systems.
// ---------------------------------------------------------------------------

const Card = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0.25rem 0 0.25rem 0.25rem;
  margin-bottom: 0.5rem;
  align-items: center;
  border: 0.0625rem solid var(--utility-card-border-color);
  border-radius: 0.25rem;
  min-height: 3rem;
`;

const CardIcon = styled.div`
  flex-grow: 1;
  max-width: 2.813rem;
  align-content: center;
  display: flex;
`;

const CardSvgIcon = styled.img`
  width: 2.5rem;
  display: inline-block;
  filter: var(--svg-color);
`;

const CardMain = styled.div`
  flex-grow: 2;
  margin-left: 5px;
`;

const PrimaryLabel = styled.div`
  font-weight: bold;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: normal;
`;

const PrimaryUrlWrapper = styled.div`
  display: inline-flex;
  align-items: center;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
`;

const ActionsIcon = styled.img`
  width: 1rem;
  display: inline-block;
  filter: var(--svg-color);
`;

// Transient prop ($hasError) prevents the boolean from being forwarded to the DOM
const SecondaryText = styled.div<{ $hasError: boolean }>`
  color: ${({ $hasError }) => ($hasError ? 'red' : 'inherit')};
`;

const CardAction = styled.div`
  flex-grow: 1;
  text-align: right;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`;

const ActionSvgIcon = styled.img`
  width: 1.4rem;
  display: inline-block;
  filter: var(--svg-color);
`;

// styled(MenuItem) shows that styled-components can wrap MUI/emotion components
const StyledMenuItem = styled(MenuItem)`
  font-size: 0.875rem;
`;

// ---------------------------------------------------------------------------

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

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card>
      <CardIcon>
        <CardSvgIcon src={srcImg} alt='' />
      </CardIcon>
      <CardMain>
        {item.primary.type !== 'URL' && <PrimaryLabel>{item.primary.name}</PrimaryLabel>}
        {item.primary.type === 'URL' && (
          <PrimaryUrlWrapper>
            <LinkButton type='button'>
              {item.primary.name}&nbsp;
              <ActionsIcon src={`${imagePath$}${item.primary.icon}.svg`} alt='' />
            </LinkButton>
          </PrimaryUrlWrapper>
        )}
        {item.secondary.text && <SecondaryText $hasError={Boolean(item.secondary.error)}>{item.secondary.text}</SecondaryText>}
      </CardMain>
      <CardAction>
        {menuIconOverride$ && (
          <ActionButton type='button' aria-label='Delete Attachment' onClick={removeAttachment}>
            <ActionSvgIcon src={menuIconOverride$} alt='' />
          </ActionButton>
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
                item.actions.map(option => (
                  <StyledMenuItem key={option.id || option.text} onClick={option.onClick}>
                    {option.text}
                  </StyledMenuItem>
                ))}
            </Menu>
          </div>
        )}
      </CardAction>
    </Card>
  );
}
