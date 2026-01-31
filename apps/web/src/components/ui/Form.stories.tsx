import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Form, { FormField } from './Form';
import Input from './Input';
import Button from './Button';

const meta: Meta<typeof Form> = {
  title: 'UI/Form',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => {
    const [formData, setFormData] = useState({ email: '', password: '' });

    return (
      <Form onSubmit={(data) => console.log('Submitted:', data)}>
        <FormField name="email" label="Email" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
        </FormField>
        <FormField name="password" label="Password" required>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
          />
        </FormField>
        <div className="flex gap-2 justify-end">
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    );
  },
};

export const WithValidation: Story = {
  render: () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
      const newErrors: Record<string, string> = {};
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!formData.email.includes('@')) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    return (
      <Form
        onSubmit={() => {
          if (validate()) {
            console.log('Form valid:', formData);
          }
        }}
      >
        <FormField name="email" label="Email" required error={errors.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            error={errors.email}
            placeholder="email@example.com"
          />
        </FormField>
        <FormField name="password" label="Password" required error={errors.password}>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            error={errors.password}
            placeholder="Enter password"
            helperText="Must be at least 8 characters"
          />
        </FormField>
        <div className="flex gap-2 justify-end">
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    );
  },
};

export const Accessibility: Story = {
  render: () => {
    return (
      <Form onSubmit={(data) => console.log(data)} aria-label="Contact form">
        <FormField name="name" label="Name" required>
          <Input type="text" aria-required="true" aria-label="Name field" placeholder="Your name" />
        </FormField>
        <FormField name="email" label="Email" required>
          <Input
            type="email"
            aria-required="true"
            aria-label="Email field"
            placeholder="email@example.com"
            aria-describedby="email-description"
          />
          <p id="email-description" className="text-sm text-gray-500 mt-1">
            We'll never share your email
          </p>
        </FormField>
        <div className="flex gap-2 justify-end">
          <Button type="submit">Submit</Button>
        </div>
      </Form>
    );
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'aria-required-attr',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
};
