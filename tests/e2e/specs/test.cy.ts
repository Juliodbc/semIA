describe('My First Test', () => {
  it('shows the sign-in screen', () => {
    cy.visit('/')
    cy.contains('ion-content', 'Bem-vindo')
    cy.contains('ion-content', 'Criar uma conta')
  })
})
