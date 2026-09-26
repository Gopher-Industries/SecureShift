import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField from '../components/FormField';
import LoadingComponent from '../components/LoadingComponent';
import { useToast } from '../components/Toast';

import { getMockEmailTemplates, updateMockEmailTemplates } from '../service/mockEmailTemplatesAPI';

const variables = [
  '{{ userName }}',
  '{{ email }}',
  '{{ shiftDate }}',
  '{{ shiftTime }}',
  '{{ companyName }}',
];

const sampleData = {
  '{{ userName }}': 'John Smith',
  '{{ email }}': 'john@example.com',
  '{{ shiftDate }}': '25 September 2026',
  '{{ shiftTime }}': '9:00 AM',
  '{{ companyName }}': 'SecureShift',
};

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { showToast } = useToast();

  // Load templates when page opens
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getMockEmailTemplates();

        setTemplates(data);

        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (error) {
        showToast('Failed to load email templates.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [showToast]);

  // Find selected template
  const selectedTemplate = templates.find((template) => template.id === selectedId);

  // Change subject or body
  const handleChange = (event) => {
    const { name, value } = event.target;

    setTemplates((currentTemplates) =>
      currentTemplates.map((template) => {
        if (template.id === selectedId) {
          return {
            ...template,
            [name]: value,
          };
        }

        return template;
      })
    );

    setShowPreview(false);
  };

  // Save template
  const handleSave = async () => {
    if (!selectedTemplate) {
      return;
    }

    if (selectedTemplate.subject.trim() === '') {
      showToast('Subject is required.', 'error');
      return;
    }

    if (selectedTemplate.body.trim() === '') {
      showToast('Email body is required.', 'error');
      return;
    }

    try {
      setSaving(true);

      await updateMockEmailTemplates(templates);

      showToast('Email template saved successfully.', 'success');
    } catch (error) {
      showToast('Failed to save email template.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Show preview
  const handlePreview = () => {
    if (!selectedTemplate) {
      return;
    }

    if (selectedTemplate.subject.trim() === '') {
      showToast('Subject is required.', 'error');
      return;
    }

    if (selectedTemplate.body.trim() === '') {
      showToast('Email body is required.', 'error');
      return;
    }

    setShowPreview(true);
  };

  // Replace variables with sample data
  const replaceVariables = (text) => {
    let result = text;

    variables.forEach((variable) => {
      result = result.replaceAll(variable, sampleData[variable]);
    });

    return result;
  };

  // Copy variable
  const copyVariable = async (variable) => {
    try {
      await navigator.clipboard.writeText(variable);

      showToast(`${variable} copied.`, 'success');
    } catch (error) {
      showToast('Could not copy variable.', 'error');
    }
  };

  if (loading) {
    return (
      <Card style={{ padding: 30 }}>
        <LoadingComponent label="Loading email templates..." />
      </Card>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Email Templates</h1>

      <p style={styles.subtitle}>Edit notification email templates and preview the changes.</p>

      <div style={styles.layout}>
        {/* Template list */}
        <Card style={styles.listCard}>
          <h2 style={styles.heading}>Templates</h2>

          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setSelectedId(template.id);
                setShowPreview(false);
              }}
              style={{
                ...styles.templateButton,
                ...(selectedId === template.id ? styles.selectedButton : {}),
              }}
            >
              {template.name}
            </button>
          ))}
        </Card>

        {/* Editor */}
        <div>
          {selectedTemplate && (
            <>
              <Card style={styles.editorCard}>
                <h2 style={styles.heading}>{selectedTemplate.name}</h2>

                <FormField
                  id="template-subject"
                  name="subject"
                  label="Email Subject"
                  value={selectedTemplate.subject}
                  onChange={handleChange}
                  placeholder="Enter email subject"
                  required
                />

                <div style={{ marginTop: 20 }}>
                  <FormField
                    id="template-body"
                    name="body"
                    label="Email Body"
                    as="textarea"
                    value={selectedTemplate.body}
                    onChange={handleChange}
                    placeholder="Enter email body"
                    required
                  />
                </div>

                {/* Variables */}
                <div style={styles.variablesBox}>
                  <h3 style={styles.variableTitle}>Available Variables</h3>

                  <p style={styles.variableText}>Click a variable to copy it.</p>

                  <div style={styles.variableList}>
                    {variables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => copyVariable(variable)}
                        style={styles.variableButton}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div style={styles.buttons}>
                  <Button type="button" onClick={handlePreview}>
                    Preview
                  </Button>

                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </Card>

              {/* Preview */}
              {showPreview && (
                <Card style={styles.previewCard}>
                  <div style={styles.previewHeader}>
                    <h2 style={styles.heading}>Email Preview</h2>

                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      style={styles.closeButton}
                    >
                      Close
                    </button>
                  </div>

                  <div style={styles.email}>
                    <p>
                      <strong>From:</strong> SecureShift
                    </p>

                    <p>
                      <strong>To:</strong> {sampleData['{{ email }}']}
                    </p>

                    <p>
                      <strong>Subject:</strong> {replaceVariables(selectedTemplate.subject)}
                    </p>

                    <hr />

                    <div style={styles.emailBody}>
                      {replaceVariables(selectedTemplate.body)
                        .split('\n')
                        .map((line, index) => (
                          <p key={index}>{line || '\u00A0'}</p>
                        ))}
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 20,
  },

  title: {
    marginBottom: 5,
  },

  subtitle: {
    color: '#777',
    marginBottom: 25,
  },

  layout: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr',
    gap: 20,
    alignItems: 'start',
  },

  listCard: {
    padding: 20,
  },

  editorCard: {
    padding: 25,
  },

  heading: {
    marginTop: 0,
    marginBottom: 20,
  },

  templateButton: {
    width: '100%',
    padding: 12,
    marginBottom: 8,
    textAlign: 'left',
    border: '1px solid #ddd',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
  },

  selectedButton: {
    background: '#eee',
    fontWeight: 'bold',
  },

  variablesBox: {
    marginTop: 25,
    padding: 15,
    background: '#f5f5f5',
    borderRadius: 8,
  },

  variableTitle: {
    margin: 0,
  },

  variableText: {
    color: '#777',
    fontSize: 14,
  },

  variableList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },

  variableButton: {
    padding: '7px 10px',
    border: '1px solid #ccc',
    borderRadius: 5,
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'monospace',
  },

  buttons: {
    display: 'flex',
    gap: 10,
    marginTop: 25,
  },

  previewCard: {
    padding: 25,
    marginTop: 20,
  },

  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  closeButton: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: 5,
    background: '#fff',
    cursor: 'pointer',
  },

  email: {
    marginTop: 20,
    padding: 25,
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
  },

  emailBody: {
    lineHeight: 1.6,
  },
};
