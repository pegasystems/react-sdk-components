import withStyles from '@mui/styles/withStyles';
import { Tab, Divider } from '@mui/material';

// LeftAlignVerticalTabs does NOT have getPConnect. So, no need to extend from PConnProps

interface LeftAlignVerticalTabsProps {
  // If any, enter additional props that only exist on this component
}

// LeftAlignVerticalTab is a specialized Tab that has styles to make it
//  left aligned and full width of the container Tabs

// Aligning the Tab labels left (with & .<class name> syntax) inspired by:
//  https://stackoverflow.com/questions/63307723/how-to-modify-the-wrapper-css-rule-of-a-tabs-component-to-make-the-text-aligned

// In this styling, "root" is the top-level "Tab" object (which is the button)
//  and the button contains spans that will match on the '> span'
const LeftAlignVerticalTabs: any = withStyles((/* theme */) => ({
  root: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'flex-start'
  },
  wrapper: {
    display: 'block',
    textAlign: 'left'
  }
}))((props: LeftAlignVerticalTabsProps) => (
  <div>
    <Tab {...props} />
    <Divider />
  </div>
));

export default LeftAlignVerticalTabs;
