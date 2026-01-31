/** * Component Gallery * Affiche tous les composants pour visualiser les changements de thème */ 'use client';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Radio from '@/components/ui/Radio';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import Accordion from '@/components/ui/Accordion';
import Progress from '@/components/ui/Progress';
import Skeleton from '@/components/ui/Skeleton';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import Tooltip from '@/components/ui/Tooltip';
import { ToastContainer, useToast } from '@/components/ui';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import StatsCard from '@/components/ui/StatsCard';
import Drawer from '@/components/ui/Drawer';
import Autocomplete from '@/components/ui/Autocomplete';
import Stepper from '@/components/ui/Stepper';
import Popover from '@/components/ui/Popover';
import TreeView from '@/components/ui/TreeView';
import type { TreeNode } from '@/components/ui/TreeView';
import type { AutocompleteOption } from '@/components/ui/Autocomplete';
import type { Step } from '@/components/ui/Stepper';
export function ComponentGallery() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { showToast } = useToast();
  const tableData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  ];
  const tableColumns = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Rôle', sortable: true },
  ];
  const autocompleteOptions: AutocompleteOption[] = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
  ];
  const stepperSteps: Step[] = [
    { id: '1', label: 'Étape 1', description: 'Première étape' },
    { id: '2', label: 'Étape 2', description: 'Deuxième étape' },
    { id: '3', label: 'Étape 3', description: 'Troisième étape' },
  ];
  const treeNodes: TreeNode[] = [
    {
      id: '1',
      label: 'Dossier 1',
      children: [
        { id: '1-1', label: 'Fichier 1.1' },
        { id: '1-2', label: 'Fichier 1.2' },
      ],
    },
    { id: '2', label: 'Dossier 2', children: [{ id: '2-1', label: 'Fichier 2.1' }] },
  ];
  return (
    <div className="space-y-8">
      {' '}
      <ToastContainer /> {/* Buttons */}{' '}
      <Card title="Boutons">
        {' '}
        <div className="flex flex-wrap gap-4">
          {' '}
          <Button variant="primary">Primary</Button> <Button variant="secondary">Secondary</Button>{' '}
          <Button variant="outline">Outline</Button> <Button variant="ghost">Ghost</Button>{' '}
          <Button variant="danger">Danger</Button>{' '}
          <Button variant="primary" size="sm">
            Small
          </Button>{' '}
          <Button variant="primary" size="lg">
            Large
          </Button>{' '}
          <Button variant="primary" loading>
            Loading
          </Button>{' '}
          <Button variant="primary" disabled>
            Disabled
          </Button>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Form Inputs */}{' '}
      <Card title="Champs de Formulaire">
        {' '}
        <div className="space-y-4">
          {' '}
          <Input label="Input standard" placeholder="Tapez quelque chose..." />{' '}
          <Input label="Input avec erreur" error="Ce champ est requis" />{' '}
          <Input label="Input avec helper" helperText="Texte d'aide" />{' '}
          <Textarea label="Textarea" placeholder="Zone de texte..." rows={4} />{' '}
          <Select
            label="Select"
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
            ]}
          />{' '}
          <div className="flex gap-6">
            {' '}
            <Checkbox label="Checkbox" /> <Radio name="radio" label="Radio 1" />{' '}
            <Radio name="radio" label="Radio 2" /> <Switch label="Switch" />{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Badges & Alerts */}{' '}
      <Card title="Badges et Alertes">
        {' '}
        <div className="space-y-4">
          {' '}
          <div className="flex gap-2 flex-wrap">
            {' '}
            <Badge variant="default">Default</Badge> <Badge variant="success">Success</Badge>{' '}
            <Badge variant="warning">Warning</Badge> <Badge variant="error">Error</Badge>{' '}
            <Badge variant="info">Info</Badge>{' '}
          </div>{' '}
          <Alert variant="info" title="Info">
            {' '}
            Ceci est une alerte d'information{' '}
          </Alert>{' '}
          <Alert variant="success" title="Succès">
            {' '}
            Opération réussie !{' '}
          </Alert>{' '}
          <Alert variant="warning" title="Attention">
            {' '}
            Ceci est un avertissement{' '}
          </Alert>{' '}
          <Alert variant="error" title="Erreur">
            {' '}
            Une erreur s'est produite{' '}
          </Alert>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Tabs & Accordion */}{' '}
      <Card title="Navigation">
        {' '}
        <div className="space-y-6">
          {' '}
          <Tabs>
            {' '}
            <TabList>
              {' '}
              <Tab value="tab1">Onglet 1</Tab> <Tab value="tab2">Onglet 2</Tab>{' '}
              <Tab value="tab3">Onglet 3</Tab>{' '}
            </TabList>{' '}
            <TabPanels>
              {' '}
              <TabPanel value="tab1">Contenu de l'onglet 1</TabPanel>{' '}
              <TabPanel value="tab2">Contenu de l'onglet 2</TabPanel>{' '}
              <TabPanel value="tab3">Contenu de l'onglet 3</TabPanel>{' '}
            </TabPanels>{' '}
          </Tabs>{' '}
          <Accordion
            items={[
              { id: '1', title: 'Section 1', content: 'Contenu de la section 1' },
              { id: '2', title: 'Section 2', content: 'Contenu de la section 2' },
            ]}
          />{' '}
        </div>{' '}
      </Card>{' '}
      {/* Progress & Loading */}{' '}
      <Card title="Chargement">
        {' '}
        <div className="space-y-4">
          {' '}
          <Progress value={25} /> <Progress value={50} /> <Progress value={75} />{' '}
          <div className="flex gap-4">
            {' '}
            <Spinner /> <Skeleton className="h-20 w-full" />{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
      {/* Avatar & Tooltip */}{' '}
      <Card title="Avatars et Tooltips">
        {' '}
        <div className="flex gap-4 items-center">
          {' '}
          <Tooltip content="Tooltip example">
            {' '}
            <Avatar name="JD" />{' '}
          </Tooltip>{' '}
          <Avatar src="https://i.pravatar.cc/150?img=1" /> <Avatar name="AB" status="online" />{' '}
        </div>{' '}
      </Card>{' '}
      {/* Modals & Overlays */}{' '}
      <Card title="Modales et Overlays">
        {' '}
        <div className="flex gap-4 flex-wrap">
          {' '}
          <Button onClick={() => setIsModalOpen(true)}>Ouvrir Modal</Button>{' '}
          <Button onClick={() => setIsDrawerOpen(true)}>Ouvrir Drawer</Button>{' '}
          <Popover
            trigger={<Button>Ouvrir Popover</Button>}
            content={<div className="p-2">Contenu du popover</div>}
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          />{' '}
          <Button onClick={() => showToast({ message: 'Toast de test', type: 'success' })}>
            {' '}
            Afficher Toast{' '}
          </Button>{' '}
        </div>{' '}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Modal de Test">
          {' '}
          <p>Ceci est le contenu de la modale</p>{' '}
        </Modal>{' '}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Drawer de Test"
          position="right"
        >
          {' '}
          <p>Ceci est le contenu du drawer</p>{' '}
        </Drawer>{' '}
      </Card>{' '}
      {/* Data Components */}{' '}
      <Card title="Composants de Données">
        {' '}
        <div className="space-y-6">
          {' '}
          <DataTable data={tableData} columns={tableColumns} pageSize={10} />{' '}
          <Pagination currentPage={1} totalPages={10} onPageChange={() => {}} />{' '}
          <StatsCard
            title="Statistiques"
            value="1,234"
            trend="+12%"
            trendDirection="up"
          />{' '}
          <EmptyState title="Aucune donnée" description="Il n'y a pas de données à afficher" />{' '}
        </div>{' '}
      </Card>{' '}
      {/* New Components */}{' '}
      <Card title="Nouveaux Composants">
        {' '}
        <div className="space-y-6">
          {' '}
          <div>
            {' '}
            <h4 className="text-sm font-semibold mb-2">Autocomplete</h4>{' '}
            <Autocomplete
              options={autocompleteOptions}
              placeholder="Rechercher..."
              minChars={0}
            />{' '}
          </div>{' '}
          <div>
            {' '}
            <h4 className="text-sm font-semibold mb-2">Stepper</h4>{' '}
            <Stepper steps={stepperSteps} currentStep={1} />{' '}
          </div>{' '}
          <div>
            {' '}
            <h4 className="text-sm font-semibold mb-2">TreeView</h4>{' '}
            <TreeView nodes={treeNodes} />{' '}
          </div>{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
