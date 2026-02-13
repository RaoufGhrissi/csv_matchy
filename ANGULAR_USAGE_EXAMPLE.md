// Example: How to use Matchy component in your Angular application

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Matchy } from './libs/matchy/src/main';
import { Option } from './libs/matchy/src/models/classes/option';
import { FieldType } from './libs/matchy/src/models/enums/field_type';
import { Condition } from './libs/matchy/src/models/classes/condition';
import { Comparer } from './libs/matchy/src/models/enums/comparer';
import { ConditonProperty } from './libs/matchy/src/models/enums/conditon_property';

@Component({
  selector: 'app-import-patients',
  template: `
    <div class="import-container">
      <h2>Import Patients</h2>
      <div #matchyContainer></div>
    </div>
  `,
  styles: [`
    .import-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class ImportPatientsComponent implements OnInit {
  @ViewChild('matchyContainer', { static: true }) matchyContainer!: ElementRef;

  ngOnInit() {
    this.initializeMatchy();
  }

  initializeMatchy() {
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
      ]),
      new Option('Record Number', 'matricule', false, FieldType.string)
    ];

    // Configure with custom button styles matching your Angular/PrimeNG theme
    const config = {
      autoMap: true, // Enable auto-mapping
      pagination: {
        enabled: true,
        itemsPerPage: 20 // Show 20 patients per page
      },
      buttons: {
        upload: {
          text: 'Upload CSV',
          className: 'p-button p-component p-button-raised',
          style: 'background: #3b82f6; border-color: #3b82f6; color: white;'
        },
        validate: {
          text: 'Validate Data',
          className: 'p-button p-component p-button-raised',
          style: 'background: #f59e0b; border-color: #f59e0b; color: white;'
        },
        submit: {
          text: 'Import Patients',
          className: 'p-button p-component p-button-raised p-button-success',
          style: 'background: #10b981; border-color: #10b981; color: white; font-weight: 600;'
        },
        reset: {
          text: 'Clear & Reset',
          className: 'p-button p-component p-button-raised p-button-secondary',
          style: 'background: #6b7280; border-color: #6b7280; color: white;'
        },
        export: {
          text: 'Export CSV',
          className: 'p-button p-component p-button-raised p-button-info',
          style: 'background: #17a2b8; border-color: #17a2b8; color: white;'
        }
      }
    };

    // Create the Matchy component
    const matchy = new Matchy(patientOptions, config);

    // Override submit method to handle the data
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
        gender: line.gender?.value || '',
        matricule: line.matricule?.value || ''
      }));

      // Call your service to import patients
      try {
        // Example API call
        // await this.patientService.importPatients(patients);
        
        console.log('Importing patients:', patients);
        alert(`Successfully imported ${patients.length} patients!`);
        
        // Optionally navigate away or refresh the list
        // this.router.navigate(['/patients']);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import patients. Please try again.');
      }
    };

    // Append to the container
    this.matchyContainer.nativeElement.appendChild(matchy);
  }
}

// ============================================
// EXAMPLE 2: Using with custom Bootstrap styles
// ============================================

export class ImportPatientsBootstrapExample implements OnInit {
  @ViewChild('matchyContainer', { static: true }) matchyContainer!: ElementRef;

  ngOnInit() {
    const options = [
      new Option('First Name', 'firstName', true, FieldType.string),
      new Option('Last Name', 'lastName', true, FieldType.string),
      new Option('Email', 'email', false, FieldType.string)
    ];

    const bootstrapConfig = {
      autoMap: true,
      pagination: {
        enabled: true,
        itemsPerPage: 25 // 25 rows per page
      },
      buttons: {
        upload: {
          text: 'Upload File',
          className: 'btn btn-primary btn-lg',
          style: 'margin-right: 10px;'
        },
        validate: {
          text: 'Check Data',
          className: 'btn btn-warning btn-lg'
        },
        submit: {
          text: 'Submit',
          className: 'btn btn-success btn-lg'
        },
        reset: {
          text: 'Reset',
          className: 'btn btn-outline-secondary btn-lg'
        },
        export: {
          text: 'Download CSV',
          className: 'btn btn-info btn-lg'
        }
      }
    };

    const matchy = new Matchy(options, bootstrapConfig);
    matchy.submit = async (data) => {
      console.log('Data submitted:', data);
    };

    this.matchyContainer.nativeElement.appendChild(matchy);
  }
}

// ============================================
// EXAMPLE 3: Disable auto-mapping
// ============================================

export class ImportPatientsNoAutoMapExample implements OnInit {
  @ViewChild('matchyContainer', { static: true }) matchyContainer!: ElementRef;

  ngOnInit() {
    const options = [
      new Option('Patient ID', 'id', true, FieldType.integer),
      new Option('Full Name', 'name', true, FieldType.string),
      new Option('Contact', 'contact', false, FieldType.string)
    ];
      
    // Disable auto-mapping - user must manually select all mappings
    const config = {
      autoMap: false,
      pagination: {
        enabled: true,
        itemsPerPage: 15
      },
      buttons: {
        upload: { text: 'Browse CSV' },
        validate: { text: 'Validate' },
        submit: { text: 'Import' },
        reset: { text: 'Clear' },
        export: { text: 'Export' }
      }
    };

    const matchy = new Matchy(options, config);
    this.matchyContainer.nativeElement.appendChild(matchy);
  }
}
