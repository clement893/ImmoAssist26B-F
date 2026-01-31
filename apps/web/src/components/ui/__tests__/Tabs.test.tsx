import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '../Tabs';

describe('Tabs', () => {
  it('renders tabs with content', () => {
    render(
      <Tabs defaultTab="tab1">
        <TabList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="tab1">Content 1</TabPanel>
          <TabPanel value="tab2">Content 2</TabPanel>
        </TabPanels>
      </Tabs>
    );

    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultTab="tab1">
        <TabList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="tab1">Content 1</TabPanel>
          <TabPanel value="tab2">Content 2</TabPanel>
        </TabPanels>
      </Tabs>
    );

    const tab2 = screen.getByText('Tab 2');
    await user.click(tab2);

    expect(screen.getByText('Content 2')).toBeVisible();
  });
});
