import { type PropsWithChildren } from 'react';
import { Tab, Tabs, Box, Badge, Tooltip } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';

import { useHierarchicalForm, type HierarchicalFormProps } from './hooks';

export default function HierarchicalForm(props: PropsWithChildren<HierarchicalFormProps>) {
  const { currentTabId, handleTabClick, processedTabs, instructions } = useHierarchicalForm(props);

  if (!currentTabId) {
    return null;
  }

  return (
    <Box display='flex' flexDirection='column'>
      {instructions && (
        <Box mb={2}>
          <div dangerouslySetInnerHTML={{ __html: instructions }} />
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <TabContext value={currentTabId.toString()}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs onChange={handleTabClick} value={currentTabId.toString()} variant='scrollable'>
              {processedTabs.map((tab: any) => {
                const tabLabel = tab.name || tab.label;
                return (
                  <Tab
                    key={tab.id}
                    label={
                      tab.errors ? (
                        <Tooltip title={`${tabLabel} has errors`} placement='top'>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{tabLabel}</span>
                            <Badge badgeContent={tab.errors} color='error' sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }} />
                          </Box>
                        </Tooltip>
                      ) : (
                        tabLabel
                      )
                    }
                    value={tab.id?.toString()}
                  />
                );
              })}
            </Tabs>
          </Box>
          {processedTabs.map((tab: any) => (
            <TabPanel key={tab.id} value={tab.id?.toString()} tabIndex={+tab.id} keepMounted sx={{ px: 0 }}>
              <div>{tab.content ? tab.content : 'No content exists'}</div>
            </TabPanel>
          ))}
        </TabContext>
      </Box>
    </Box>
  );
}
