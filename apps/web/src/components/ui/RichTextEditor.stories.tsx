import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import RichTextEditor from './RichTextEditor';

const meta: Meta<typeof RichTextEditor> = {
  title: 'UI/RichTextEditor',
  component: RichTextEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A rich text editor component with toolbar, link dialog, and advanced formatting options. Supports HTML sanitization for security.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The HTML content value',
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when content changes',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when editor is empty',
    },
    label: {
      control: 'text',
      description: 'Label for the editor',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display below the editor',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the editor',
    },
    minHeight: {
      control: 'text',
      description: 'Minimum height of the editor',
    },
    toolbar: {
      control: 'boolean',
      description: 'Show/hide the toolbar',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

// Interactive wrapper component
const InteractiveEditor = (args: any) => {
  const [value, setValue] = useState(args.value || '');

  return (
    <RichTextEditor
      {...args}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        args.onChange?.(newValue);
      }}
    />
  );
};

export const Default: Story = {
  render: InteractiveEditor,
  args: {
    placeholder: 'Tapez votre texte...',
    toolbar: true,
  },
};

export const WithLabel: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Description',
    placeholder: 'Entrez une description détaillée...',
    helperText: "Vous pouvez utiliser la barre d'outils pour formater votre texte",
  },
};

export const WithInitialValue: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Contenu',
    value:
      '<p>Ceci est un <strong>texte</strong> avec du <em>formatage</em>.</p><ul><li>Premier élément</li><li>Deuxième élément</li></ul>',
    placeholder: 'Tapez votre texte...',
  },
};

export const WithError: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Description',
    error: 'Ce champ est requis',
    placeholder: 'Tapez votre texte...',
  },
};

export const Disabled: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Description',
    disabled: true,
    value: '<p>Ce contenu est <strong>désactivé</strong>.</p>',
  },
};

export const WithoutToolbar: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Éditeur simple',
    toolbar: false,
    placeholder: 'Tapez votre texte...',
  },
};

export const CustomHeight: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Grand éditeur',
    minHeight: '400px',
    placeholder: 'Tapez votre texte...',
    helperText: 'Cet éditeur a une hauteur minimale de 400px',
  },
};

export const RichContent: Story = {
  render: InteractiveEditor,
  args: {
    label: 'Article complet',
    value: `
      <h2>Introduction</h2>
      <p>Ceci est un <strong>exemple</strong> de contenu riche avec plusieurs <em>éléments</em> formatés.</p>
      <h3>Liste à puces</h3>
      <ul>
        <li>Premier élément</li>
        <li>Deuxième élément</li>
        <li>Troisième élément</li>
      </ul>
      <h3>Liste numérotée</h3>
      <ol>
        <li>Étape 1</li>
        <li>Étape 2</li>
        <li>Étape 3</li>
      </ol>
      <p>Vous pouvez également créer des <a href="https://example.com" target="_blank" rel="noopener noreferrer">liens</a>.</p>
    `,
    placeholder: 'Tapez votre texte...',
  },
};

export const AllFeatures: Story = {
  render: () => {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('<p>Contenu initial avec <strong>formatage</strong>.</p>');

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Éditeur vide</h3>
          <RichTextEditor
            label="Nouveau contenu"
            value={value1}
            onChange={setValue1}
            placeholder="Commencez à taper..."
            helperText="Utilisez la barre d'outils pour formater votre texte"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Éditeur avec contenu</h3>
          <RichTextEditor
            label="Contenu existant"
            value={value2}
            onChange={setValue2}
            placeholder="Tapez votre texte..."
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Éditeur avec erreur</h3>
          <RichTextEditor
            label="Champ requis"
            value=""
            onChange={() => {}}
            error="Ce champ ne peut pas être vide"
            placeholder="Tapez votre texte..."
          />
        </div>
      </div>
    );
  },
};
