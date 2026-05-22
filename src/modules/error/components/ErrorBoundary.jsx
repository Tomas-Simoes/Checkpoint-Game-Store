import { Component } from "react";
import { ErrorPage } from "./ErrorPage.jsx";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorPage
          error={{
            actionHref: "#/",
            actionLabel: "Voltar ao início",
            detail: this.state.error.message,
            message: "A interface encontrou um erro inesperado.",
            title: "Erro na aplicação"
          }}
        />
      );
    }

    return this.props.children;
  }
}
