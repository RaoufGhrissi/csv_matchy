// Example: How to use Matchy component in React applications

import React, { useEffect, useRef, useState } from 'react';
import { Matchy } from './src/main';
import { Option } from './src/models/classes/option';
import { FieldType } from './src/models/enums/field_type';
import { Condition } from './src/models/classes/condition';
import { Comparer } from './src/models/enums/comparer';
import { ConditonProperty } from './src/models/enums/conditon_property';

// ============================================
// EXAMPLE 1: Basic React Component with Matchy
// ============================================

interface ImportPatientsProps {
  onComplete?: (data: any) => void;
}

export const ImportPatientsComponent: React.FC<ImportPatientsProps> = ({ onComplete }) => {
  const matchyContainerRef = useRef<HTMLDivElement>(null);
  const matchyInstanceRef = useRef<Matchy | null>(null);

  useEffect(() => {
    if (!matchyContainerRef.current) return;

    // Define expected patient columns with validation
    const patientOptions = [
      new Option('First Name', 'firstName', true, FieldType.string, [
        new Condition(
          ConditonProperty.length,
          2,
          Comparer.gte,
          'First name must be at least 2 characters'
        )
      ]),
      new Option('Last Name', 'lastName', true, FieldType.string, [
        new Condition(
          ConditonProperty.length,
          2,
          Comparer.gte,
          'Last name must be at least 2 characters'
        )
      ]),
      new Option('Email', 'email', false, FieldType.string, [
        new Condition(
          ConditonProperty.regex,
          '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
          Comparer.e,
          'Invalid email format'
        )
      ]),
      new Option('Phone', 'phone', false, FieldType.string, [
        new Condition(
          ConditonProperty.regex,
          '^[0-9]{8,15}$',
          Comparer.e,
          'Phone must be 8-15 digits'
        )
      ]),
      new Option('Birth Date', 'birthDate', false, FieldType.string, [
        new Condition(
          ConditonProperty.regex,
          '^\\d{4}-\\d{2}-\\d{2}$',
          Comparer.e,
          'Date must be in YYYY-MM-DD format'
        )
      ]),
      new Option('Address', 'address', false, FieldType.string),
      new Option('Gender', 'gender', false, FieldType.string, [
        new Condition(
          ConditonProperty.value,
          ['Male', 'Female', 'M', 'F'],
          Comparer.in,
          'Gender must be Male or Female'
        )
      ])
    ];

    // Configure Matchy with custom styles
    const config = {
      autoMap: true,
      pagination: {
        enabled: true,
        itemsPerPage: 20
      },
      buttons: {
        upload: {
          text: 'Upload CSV',
          className: 'btn btn-primary',
          style: 'background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;'
        },
        validate: {
          text: 'Validate Data',
          className: 'btn btn-warning',
          style: 'background: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;'
        },
        submit: {
          text: 'Import Patients',
          className: 'btn btn-success',
          style: 'background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600;'
        },
        reset: {
          text: 'Clear & Reset',
          className: 'btn btn-secondary',
          style: 'background: #6b7280; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;'
        },
        export: {
          text: 'Export CSV',
          className: 'btn btn-info',
          style: 'background: #17a2b8; color: white; padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;'
        }
      }
    };

    // Create Matchy instance
    const matchy = new Matchy(patientOptions, config);

    // Override submit method
    matchy.submit = async (data) => {
      console.log('Patient data to import:', data);

      // Transform data for your API
      const patients = data.lines.map((line: any) => ({
        firstName: line.firstName?.value || '',
        lastName: line.lastName?.value || '',
        email: line.email?.value || '',
        phone: line.phone?.value || '',
        birthDate: line.birthDate?.value || null,
        address: line.address?.value || '',
        gender: line.gender?.value || ''
      }));

      try {
        // Example API call
        // const response = await fetch('/api/patients/import', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ patients })
        // });
        
        console.log('Importing patients:', patients);
        alert(`Successfully imported ${patients.length} patients!`);
        
        if (onComplete) {
          onComplete(patients);
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import patients. Please try again.');
      }
    };

    // Append to container
    matchyContainerRef.current.appendChild(matchy);
    matchyInstanceRef.current = matchy;

    // Cleanup on unmount
    return () => {
      if (matchyContainerRef.current && matchyInstanceRef.current) {
        matchyContainerRef.current.removeChild(matchyInstanceRef.current);
      }
    };
  }, [onComplete]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.875rem', fontWeight: 'bold' }}>
        Import Patients
      </h2>
      <div ref={matchyContainerRef}></div>
    </div>
  );
};

// ============================================
// EXAMPLE 2: Using Matchy with React Hooks
// ============================================

export const useMatchy = (
  options: Option[],
  config?: any,
  onSubmit?: (data: any) => Promise<void>
) => {
  const [matchy, setMatchy] = useState<Matchy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const matchyInstance = new Matchy(options, config);

    if (onSubmit) {
      matchyInstance.submit = onSubmit;
    }

    containerRef.current.appendChild(matchyInstance);
    setMatchy(matchyInstance);

    return () => {
      if (containerRef.current && matchyInstance) {
        containerRef.current.removeChild(matchyInstance);
      }
    };
  }, [options, config, onSubmit]);

  return { matchy, containerRef };
};

// Usage of the hook
export const ImportWithHook: React.FC = () => {
  const options = [
    new Option('Name', 'name', true, FieldType.string),
    new Option('Email', 'email', true, FieldType.string),
    new Option('Age', 'age', false, FieldType.integer)
  ];

  const config = {
    autoMap: true,
    pagination: { enabled: true, itemsPerPage: 25 },
    buttons: {
      export: { text: 'Export Data' }
    }
  };

  const handleSubmit = async (data: any) => {
    console.log('Submitting data:', data);
    // Your API call here
  };

  const { containerRef } = useMatchy(options, config, handleSubmit);

  return (
    <div className="import-container">
      <h2>Import Data</h2>
      <div ref={containerRef}></div>
    </div>
  );
};

// ============================================
// EXAMPLE 3: Matchy with Tailwind CSS
// ============================================

export const ImportWithTailwind: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const options = [
      new Option('User ID', 'userId', true, FieldType.integer),
      new Option('Username', 'username', true, FieldType.string),
      new Option('Email', 'email', false, FieldType.string)
    ];

    const config = {
      autoMap: true,
      pagination: {
        enabled: true,
        itemsPerPage: 30
      },
      buttons: {
        upload: {
          text: 'Upload',
          className: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200'
        },
        validate: {
          text: 'Validate',
          className: 'bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-200'
        },
        submit: {
          text: 'Submit',
          className: 'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200'
        },
        reset: {
          text: 'Reset',
          className: 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-200'
        },
        export: {
          text: 'Export',
          className: 'bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition duration-200'
        }
      }
    };

    const matchy = new Matchy(options, config);
    
    matchy.submit = async (data) => {
      console.log('Data submitted:', data);
    };

    containerRef.current.appendChild(matchy);

    return () => {
      if (containerRef.current && matchy) {
        containerRef.current.removeChild(matchy);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Import Users</h1>
      <div ref={containerRef}></div>
    </div>
  );
};

// ============================================
// EXAMPLE 4: Matchy with Material-UI styling
// ============================================

export const ImportWithMaterialUI: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const options = [
      new Option('Product Name', 'productName', true, FieldType.string),
      new Option('Price', 'price', true, FieldType.float),
      new Option('Quantity', 'quantity', true, FieldType.integer)
    ];

    const config = {
      autoMap: true,
      pagination: {
        enabled: true,
        itemsPerPage: 15
      },
      buttons: {
        upload: {
          text: 'Upload',
          style: `
            background: #1976d2;
            color: white;
            padding: 8px 22px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
            transition: all 0.3s;
          `
        },
        validate: {
          text: 'Validate',
          style: `
            background: #ed6c02;
            color: white;
            padding: 8px 22px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
          `
        },
        submit: {
          text: 'Submit',
          style: `
            background: #2e7d32;
            color: white;
            padding: 8px 22px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
          `
        },
        reset: {
          text: 'Reset',
          style: `
            background: #757575;
            color: white;
            padding: 8px 22px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
          `
        },
        export: {
          text: 'Export',
          style: `
            background: #0288d1;
            color: white;
            padding: 8px 22px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
          `
        }
      }
    };

    const matchy = new Matchy(options, config);
    
    matchy.submit = async (data) => {
      console.log('Products imported:', data);
    };

    containerRef.current.appendChild(matchy);

    return () => {
      if (containerRef.current && matchy) {
        containerRef.current.removeChild(matchy);
      }
    };
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '24px' }}>
        Import Products
      </h2>
      <div ref={containerRef}></div>
    </div>
  );
};

// ============================================
// EXAMPLE 5: Advanced - With State Management
// ============================================

interface ImportState {
  isLoading: boolean;
  error: string | null;
  successCount: number;
}

export const AdvancedImportComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ImportState>({
    isLoading: false,
    error: null,
    successCount: 0
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const options = [
      new Option('Employee ID', 'employeeId', true, FieldType.integer),
      new Option('Full Name', 'fullName', true, FieldType.string),
      new Option('Department', 'department', false, FieldType.string),
      new Option('Salary', 'salary', false, FieldType.float)
    ];

    const config = {
      autoMap: true,
      pagination: { enabled: true, itemsPerPage: 20 },
      buttons: {
        upload: { text: 'Upload CSV' },
        validate: { text: 'Validate Data' },
        submit: { text: 'Import Employees' },
        reset: { text: 'Clear' },
        export: { text: 'Download' }
      }
    };

    const matchy = new Matchy(options, config);
    
    matchy.submit = async (data) => {
      setState({ isLoading: true, error: null, successCount: 0 });
      
      try {
        const employees = data.lines.map((line: any) => ({
          employeeId: parseInt(line.employeeId?.value || '0'),
          fullName: line.fullName?.value || '',
          department: line.department?.value || '',
          salary: parseFloat(line.salary?.value || '0')
        }));

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // const response = await fetch('/api/employees/import', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ employees })
        // });

        setState({ 
          isLoading: false, 
          error: null, 
          successCount: employees.length 
        });
        
        alert(`Successfully imported ${employees.length} employees!`);
      } catch (error: any) {
        setState({ 
          isLoading: false, 
          error: error.message, 
          successCount: 0 
        });
      }
    };

    containerRef.current.appendChild(matchy);

    return () => {
      if (containerRef.current && matchy) {
        containerRef.current.removeChild(matchy);
      }
    };
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Import Employees</h2>
      
      {state.isLoading && (
        <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '4px', marginBottom: '1rem' }}>
          Loading... Please wait.
        </div>
      )}
      
      {state.error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '4px', marginBottom: '1rem' }}>
          Error: {state.error}
        </div>
      )}
      
      {state.successCount > 0 && (
        <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '4px', marginBottom: '1rem' }}>
          Successfully imported {state.successCount} employees!
        </div>
      )}
      
      <div ref={containerRef}></div>
    </div>
  );
};

// ============================================
// EXAMPLE 6: TypeScript with strict typing
// ============================================

interface PatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string | null;
  address: string;
  gender: string;
}

interface ImportResult {
  success: boolean;
  data?: PatientData[];
  error?: string;
}

export const TypedImportComponent: React.FC<{
  onImportComplete: (result: ImportResult) => void;
}> = ({ onImportComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const patientOptions: Option[] = [
      new Option('First Name', 'firstName', true, FieldType.string),
      new Option('Last Name', 'lastName', true, FieldType.string),
      new Option('Email', 'email', false, FieldType.string),
      new Option('Phone', 'phone', false, FieldType.string),
      new Option('Birth Date', 'birthDate', false, FieldType.string),
      new Option('Address', 'address', false, FieldType.string),
      new Option('Gender', 'gender', false, FieldType.string)
    ];

    const matchy = new Matchy(patientOptions, {
      autoMap: true,
      pagination: { enabled: true, itemsPerPage: 20 },
      buttons: {
        export: { text: 'Export CSV' }
      }
    });

    matchy.submit = async (data) => {
      try {
        const patients: PatientData[] = data.lines.map((line: any) => ({
          firstName: line.firstName?.value || '',
          lastName: line.lastName?.value || '',
          email: line.email?.value || '',
          phone: line.phone?.value || '',
          birthDate: line.birthDate?.value || null,
          address: line.address?.value || '',
          gender: line.gender?.value || ''
        }));

        onImportComplete({ success: true, data: patients });
      } catch (error: any) {
        onImportComplete({ success: false, error: error.message });
      }
    };

    containerRef.current.appendChild(matchy);

    return () => {
      if (containerRef.current && matchy) {
        containerRef.current.removeChild(matchy);
      }
    };
  }, [onImportComplete]);

  return <div ref={containerRef}></div>;
};
