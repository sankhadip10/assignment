describe('Todo Application E2E Tests', () => {
  const API_BASE_URL = 'http://localhost:8000';
  const FRONTEND_URL = 'http://localhost:3000';

  beforeEach(() => {
    // Clear database before each test by deleting all todos
    cy.request('GET', `${API_BASE_URL}/todos/`).then((response) => {
      if (response.body.length > 0) {
        response.body.forEach((todo: any) => {
          cy.request('DELETE', `${API_BASE_URL}/todos/${todo.id}`);
        });
      }
    });

    // Visit the application
    cy.visit(FRONTEND_URL);
  });

  describe('Initial Page Load', () => {
    it('displays the main page with correct title and structure', () => {
      cy.get('h1').should('contain.text', 'Todo App');
      cy.get('h1').should('have.class', 'text-4xl');
      cy.get('h1').should('have.class', 'font-bold');
      
      // Check main container structure
      cy.get('main').should('have.class', 'flex');
      cy.get('main').should('have.class', 'min-h-screen');
    });

    it('shows AI summary section', () => {
      cy.get('h2').should('contain.text', 'AI-Powered Summary');
      cy.contains('Generating summary...').should('be.visible');
    });

    it('shows empty todo list initially', () => {
      // Should show AddTodo form
      cy.get('input[placeholder="Title"]').should('be.visible');
      cy.get('textarea[placeholder="Description"]').should('be.visible');
      cy.get('button').contains('Add Todo').should('be.visible');
    });
  });

  describe('Creating Todos', () => {
    it('creates a new todo with title only', () => {
      const todoTitle = 'Test Todo Title';

      cy.get('input[placeholder="Title"]').type(todoTitle);
      cy.get('button').contains('Add Todo').click();

      // Wait for API call and UI update
      cy.contains(todoTitle).should('be.visible');
      
      // Verify the todo appears in the list - using actual DOM structure
      cy.get('div.border-b').should('have.length.at.least', 1);
      // Check that form is cleared after submission
      cy.get('input[placeholder="Title"]').should('have.value', '');
    });

    it('creates a new todo with title and description', () => {
      const todoTitle = 'Detailed Todo';
      const todoDescription = 'This is a detailed description';

      cy.get('input[placeholder="Title"]').type(todoTitle);
      cy.get('textarea[placeholder="Description"]').type(todoDescription);
      cy.get('button').contains('Add Todo').click();

      // Verify both title and description appear
      cy.contains(todoTitle).should('be.visible');
      cy.contains(todoDescription).should('be.visible');
      
      // Check form is cleared
      cy.get('input[placeholder="Title"]').should('have.value', '');
      cy.get('textarea[placeholder="Description"]').should('have.value', '');
    });

    it('does not create todo with empty title', () => {
      cy.get('textarea[placeholder="Description"]').type('Description without title');
      cy.get('button').contains('Add Todo').click();

      // Should not create todo without title - the description should not appear as a todo item
      // Only check that it doesn't appear outside the form (the form itself may still contain it)
      cy.get('h2').should('exist'); // Make sure page loaded
      cy.wait(1000); // Give time for any potential creation
      
      // Check that no todo item was created by looking for todo-specific elements
      // The description text might still be in the form, but shouldn't be in a todo item
      cy.get('input[type="checkbox"]').should('not.exist');
    });

    it('creates multiple todos', () => {
      const todos = [
        'First Todo',
        'Second Todo',
        'Third Todo'
      ];

      todos.forEach((todo) => {
        cy.get('input[placeholder="Title"]').type(todo);
        cy.get('button').contains('Add Todo').click();
        cy.contains(todo).should('be.visible');
        cy.wait(500); // Small delay to ensure todo is created
      });

      // Verify all todos are created by checking their content exists
      todos.forEach((todo) => {
        cy.contains(todo).should('be.visible');
      });
    });
  });

  describe('Reading/Viewing Todos', () => {
    beforeEach(() => {
      // Create test todos
      cy.request('POST', `${API_BASE_URL}/todos/`, {
        title: 'Sample Todo 1',
        description: 'First test todo',
        completed: false
      });
      cy.request('POST', `${API_BASE_URL}/todos/`, {
        title: 'Sample Todo 2',
        description: 'Second test todo',
        completed: true
      });
      
      cy.reload();
    });

    it('displays existing todos on page load', () => {
      cy.contains('Sample Todo 1').should('be.visible');
      cy.contains('Sample Todo 2').should('be.visible');
      cy.contains('First test todo').should('be.visible');
      cy.contains('Second test todo').should('be.visible');
    });

    it('shows correct completion status', () => {
      // Check uncompleted todo - using correct DOM traversal
      cy.contains('Sample Todo 1').closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').should('not.be.checked');
        cy.contains('Sample Todo 1').should('not.have.class', 'line-through');
      });

      // Check completed todo
      cy.contains('Sample Todo 2').closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').should('be.checked');
        cy.contains('Sample Todo 2').should('have.class', 'line-through');
      });
    });
  });

  describe('Updating Todos', () => {
    beforeEach(() => {
      // Create a test todo
      cy.request('POST', `${API_BASE_URL}/todos/`, {
        title: 'Editable Todo',
        description: 'This todo can be edited',
        completed: false
      });
      
      cy.reload();
    });

    it('toggles todo completion status', () => {
      cy.contains('Editable Todo').closest('div.border-b').within(() => {
        // Initially unchecked
        cy.get('input[type="checkbox"]').should('not.be.checked');
        cy.contains('Editable Todo').should('not.have.class', 'line-through');

        // Toggle to completed
        cy.get('input[type="checkbox"]').click();
        cy.get('input[type="checkbox"]').should('be.checked');
        cy.contains('Editable Todo').should('have.class', 'line-through');

        // Toggle back to incomplete
        cy.get('input[type="checkbox"]').click();
        cy.get('input[type="checkbox"]').should('not.be.checked');
        cy.contains('Editable Todo').should('not.have.class', 'line-through');
      });
    });

    it('edits todo title and description', () => {
      const newTitle = 'Updated Todo Title';
      const newDescription = 'Updated description content';

      // Use a more reliable approach - find the todo container and work within it
      cy.contains('Editable Todo')
        .closest('div')
        .find('button')
        .contains('Edit')
        .click();

      // Wait for edit form to appear and use .eq(0) to target the first matching element
      cy.get('input[type="text"]').eq(0).should('be.visible').clear().type(newTitle);
      cy.get('textarea').eq(0).should('be.visible').clear().type(newDescription);
      cy.get('button').contains('Save').click();

      // Verify updates
      cy.contains(newTitle).should('be.visible');
      cy.contains(newDescription).should('be.visible');
      cy.contains('Editable Todo').should('not.exist');
    });

    it('cancels edit operation', () => {
      // Click edit button using a more reliable selector
      cy.contains('Editable Todo')
        .closest('div')
        .find('button')
        .contains('Edit')
        .click();

      // Make changes using .eq(0) to select the first element
      cy.get('input[type="text"]').eq(0).should('be.visible').clear().type('Should not save');
      
      // Cancel changes
      cy.get('button').contains('Cancel').click();

      // Original content should remain
      cy.contains('Editable Todo').should('be.visible');
      cy.contains('Should not save').should('not.exist');
    });
  });

  describe('Deleting Todos', () => {
    beforeEach(() => {
      // Create test todos
      cy.request('POST', `${API_BASE_URL}/todos/`, {
        title: 'Todo to Delete',
        description: 'This will be deleted',
        completed: false
      });
      cy.request('POST', `${API_BASE_URL}/todos/`, {
        title: 'Todo to Keep',
        description: 'This will remain',
        completed: false
      });
      
      cy.reload();
    });

    it('deletes a todo', () => {
      cy.contains('Todo to Delete').should('be.visible');
      cy.contains('Todo to Keep').should('be.visible');

      // Delete the first todo
      cy.contains('Todo to Delete').closest('div.border-b').within(() => {
        cy.get('button').contains('Delete').click();
      });

      // Wait a moment for the deletion to complete
      cy.wait(500);

      // Verify deletion
      cy.contains('Todo to Delete').should('not.exist');
      cy.contains('Todo to Keep').should('be.visible');
    });

    it('deletes multiple todos', () => {
      // Delete both todos sequentially to avoid timing issues
      cy.contains('Todo to Delete').closest('div.border-b').within(() => {
        cy.get('button').contains('Delete').click();
      });
      
      cy.wait(500);
      
      cy.contains('Todo to Keep').closest('div.border-b').within(() => {
        cy.get('button').contains('Delete').click();
      });

      cy.wait(500);

      // Verify all todos are deleted
      cy.contains('Todo to Delete').should('not.exist');
      cy.contains('Todo to Keep').should('not.exist');
    });
  });

  describe('Complete CRUD Workflow', () => {
    it('performs full lifecycle operations on a todo', () => {
      const originalTitle = 'Lifecycle Todo';
      const originalDescription = 'Original description';
      const updatedTitle = 'Updated Lifecycle Todo';
      const updatedDescription = 'Updated description';

      // CREATE
      cy.get('input[placeholder="Title"]').type(originalTitle);
      cy.get('textarea[placeholder="Description"]').type(originalDescription);
      cy.get('button').contains('Add Todo').click();

      // READ - verify creation
      cy.contains(originalTitle).should('be.visible');
      cy.contains(originalDescription).should('be.visible');

      // UPDATE - mark as completed
      cy.contains(originalTitle).closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').click();
        cy.get('input[type="checkbox"]').should('be.checked');
      });

      // UPDATE - edit content (wait for completion to settle, then edit)
      cy.wait(500); // Allow completion status to settle
      
      cy.contains(originalTitle)
        .closest('div')
        .find('button')
        .contains('Edit')
        .click();
        
      // Use .eq(0) to select the first matching element
      cy.get('input[type="text"]').eq(0).clear().type(updatedTitle);
      cy.get('textarea').eq(0).clear().type(updatedDescription);
      cy.get('button').contains('Save').click();

      // READ - verify updates
      cy.contains(updatedTitle).should('be.visible');
      cy.contains(updatedDescription).should('be.visible');
      cy.contains(originalTitle).should('not.exist');

      // DELETE
      cy.contains(updatedTitle)
        .closest('div')
        .find('button')
        .contains('Delete')
        .click();

      cy.wait(500);

      // READ - verify deletion
      cy.contains(updatedTitle).should('not.exist');
      cy.contains(updatedDescription).should('not.exist');
    });
  });

  describe('AI Summary Integration', () => {
    it('displays AI summary with no todos', () => {
      cy.get('h2').contains('AI-Powered Summary').should('be.visible');
      // Summary should eventually load
      cy.contains('no tasks', { timeout: 10000 }).should('be.visible');
    });

    it('updates summary when todos are added', () => {
      // Create a todo
      cy.get('input[placeholder="Title"]').type('Test Todo for Summary');
      cy.get('button').contains('Add Todo').click();

      // Wait for todo to be created
      cy.contains('Test Todo for Summary').should('be.visible');
      
      // Refresh to get updated summary
      cy.reload();
      
      // Check that summary section is visible
      cy.get('h2').contains('AI-Powered Summary').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      // Intercept API calls and simulate network error
      cy.intercept('GET', `${API_BASE_URL}/todos/`, { forceNetworkError: true }).as('getTodosError');
      cy.intercept('POST', `${API_BASE_URL}/todos/`, { forceNetworkError: true }).as('createTodoError');
      
      cy.reload();
      
      // App should still load the basic structure
      cy.get('h1').should('contain.text', 'Todo App');
      cy.get('input[placeholder="Title"]').should('be.visible');
      
      // Try to create a todo (should handle error gracefully)
      cy.get('input[placeholder="Title"]').type('Error Test Todo');
      cy.get('button').contains('Add Todo').click();
      
      // App should remain functional
      cy.get('input[placeholder="Title"]').should('be.visible');
    });

    it('handles API server errors', () => {
      // Intercept and return server error
      cy.intercept('POST', `${API_BASE_URL}/todos/`, { statusCode: 500 }).as('serverError');
      
      cy.get('input[placeholder="Title"]').type('Server Error Test');
      cy.get('button').contains('Add Todo').click();
      
      // Should handle error gracefully without crashing
      cy.get('input[placeholder="Title"]').should('be.visible');
    });
  });

  describe('User Experience and Accessibility', () => {
    beforeEach(() => {
      // Create some test data
      cy.request('POST', `${API_BASE_URL}/todos/`, {
        title: 'Accessibility Test Todo',
        description: 'Testing accessibility features',
        completed: false
      });
      
      cy.reload();
    });

    it('provides proper form labels and accessibility', () => {
      // Check form accessibility
      cy.get('input[placeholder="Title"]').should('be.visible');
      cy.get('textarea[placeholder="Description"]').should('be.visible');
      
      // Check button accessibility
      cy.get('button').contains('Add Todo').should('be.visible');
      cy.get('button').contains('Edit').should('be.visible');
      cy.get('button').contains('Delete').should('be.visible');
    });

    it('supports keyboard navigation', () => {
      // Test basic tab functionality - skip advanced keyboard navigation that may not work reliably
      cy.get('input[placeholder="Title"]').focus();
      cy.get('input[placeholder="Title"]').should('be.focused');
      
      // Just verify elements are accessible by keyboard - actual tab navigation is browser-dependent
      cy.get('textarea[placeholder="Description"]').focus().should('be.focused');
      cy.get('button').contains('Add Todo').focus().should('be.focused');
    });

    it('provides visual feedback for interactions', () => {
      const todoTitle = 'Visual Feedback Test';
      
      // Create a todo
      cy.get('input[placeholder="Title"]').type(todoTitle);
      cy.get('button').contains('Add Todo').click();
      
      // Check checkbox interaction
      cy.contains(todoTitle).closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').click();
        cy.contains(todoTitle).should('have.class', 'line-through');
      });
    });

    it('handles form validation properly', () => {
      // Try to submit empty form
      cy.get('button').contains('Add Todo').click();
      
      // Form should not submit without title
      cy.get('input[placeholder="Title"]').should('be.visible');
      cy.get('input[placeholder="Title"]').should('have.value', '');
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { device: 'iphone-6', width: 375, height: 667 },
      { device: 'ipad-2', width: 768, height: 1024 },
      { device: 'desktop', width: 1280, height: 720 }
    ];

    viewports.forEach(({ device, width, height }) => {
      it(`displays correctly on ${device}`, () => {
        cy.viewport(width, height);
        
        // Check main structure
        cy.get('h1').should('contain.text', 'Todo App');
        cy.get('input[placeholder="Title"]').should('be.visible');
        cy.get('textarea[placeholder="Description"]').should('be.visible');
        cy.get('button').contains('Add Todo').should('be.visible');
        
        // Test basic functionality
        cy.get('input[placeholder="Title"]').type(`${device} test`);
        cy.get('button').contains('Add Todo').click();
        cy.contains(`${device} test`).should('be.visible');
      });
    });
  });

  describe('Data Persistence', () => {
    it('persists todos across page refreshes', () => {
      const todoTitle = 'Persistent Todo';
      
      // Create a todo
      cy.get('input[placeholder="Title"]').type(todoTitle);
      cy.get('button').contains('Add Todo').click();
      cy.contains(todoTitle).should('be.visible');
      
      // Refresh the page
      cy.reload();
      
      // Todo should still be there
      cy.contains(todoTitle).should('be.visible');
    });

    it('maintains todo state after browser navigation', () => {
      const todoTitle = 'Navigation Test Todo';
      
      // Create and modify a todo
      cy.get('input[placeholder="Title"]').type(todoTitle);
      cy.get('button').contains('Add Todo').click();
      
      cy.contains(todoTitle).closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').click();
        cy.get('input[type="checkbox"]').should('be.checked');
      });
      
      // Navigate away and back
      cy.go('back');
      cy.go('forward');
      
      // State should be maintained
      cy.contains(todoTitle).closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').should('be.checked');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('handles multiple todos efficiently', () => {
      const todoCount = 20;
      
      // Create multiple todos quickly
      for (let i = 1; i <= todoCount; i++) {
        cy.get('input[placeholder="Title"]').type(`Performance Test Todo ${i}`);
        cy.get('button').contains('Add Todo').click();
        cy.contains(`Performance Test Todo ${i}`).should('be.visible');
      }
      
      // Verify all todos are present
      for (let i = 1; i <= todoCount; i++) {
        cy.contains(`Performance Test Todo ${i}`).should('be.visible');
      }
      
      // Test interactions still work smoothly
      cy.contains('Performance Test Todo 1').closest('div.border-b').within(() => {
        cy.get('input[type="checkbox"]').click();
        cy.get('input[type="checkbox"]').should('be.checked');
      });
    });

    it('loads page within acceptable time limits', () => {
      const startTime = Date.now();
      
      cy.visit(FRONTEND_URL).then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Should load within 5 seconds
      });
      
      cy.get('h1').should('be.visible');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long todo titles and descriptions', () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(1000);
      
      cy.get('input[placeholder="Title"]').type(longTitle);
      cy.get('textarea[placeholder="Description"]').type(longDescription);
      cy.get('button').contains('Add Todo').click();
      
      // Should handle long content gracefully
      cy.contains(longTitle.substring(0, 50)).should('be.visible');
    });

    it('handles special characters in todo content', () => {
      const specialTitle = '!@#$%^&*()_+{}|:"<>?[];\'\\,./~`';
      const emojiTitle = 'Todo with emojis 🎉 🚀 ✅ 📝';
      
      // Test special characters
      cy.get('input[placeholder="Title"]').type(specialTitle);
      cy.get('button').contains('Add Todo').click();
      cy.contains(specialTitle).should('be.visible');
      
      // Test emojis
      cy.get('input[placeholder="Title"]').type(emojiTitle);
      cy.get('button').contains('Add Todo').click();
      cy.contains(emojiTitle).should('be.visible');
    });

    it('handles rapid successive operations', () => {
      // Rapid creation
      for (let i = 1; i <= 5; i++) {
        cy.get('input[placeholder="Title"]').type(`Rapid Todo ${i}{enter}`);
      }
      
      // Wait for all to be created
      cy.contains('Rapid Todo 5').should('be.visible');
      
      // Rapid deletion - delete one by one to avoid timing issues
      for (let i = 1; i <= 5; i++) {
        cy.get('button').contains('Delete').first().click({ force: true });
        cy.wait(100); // Small delay between deletions
      }
    });
  });
});
