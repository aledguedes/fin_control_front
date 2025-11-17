import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true,
    },
    CurrencyPipe,
  ],
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  private el = inject(ElementRef<HTMLInputElement>);
  private currencyPipe = inject(CurrencyPipe);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Este método é chamado pelo Angular forms para escrever um valor do modelo para a view.
  writeValue(value: number | null): void {
    const formattedValue = this.format(value);
    this.el.nativeElement.value = formattedValue;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  // Ouve a entrada do usuário.
  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const numericValue = this.parseToNumber(value);
    
    // Propaga o valor numérico de volta para o modelo.
    this.onChange(numericValue);
    
    // Re-formata o valor no campo de input.
    const formattedValue = this.format(numericValue);
    this.el.nativeElement.value = formattedValue;
  }
  
  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private parseToNumber(value: string): number | null {
    if (!value) return null;
    // Remove todos os caracteres não numéricos.
    const digits = value.replace(/\D/g, '');
    if (digits === '') return null;
    // Converte a string de inteiros (centavos) para um valor numérico (reais).
    return parseInt(digits, 10) / 100;
  }

  private format(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    // Usa CurrencyPipe para formatar o número de acordo com o padrão brasileiro.
    // String vazia para o símbolo esconde 'R$'. O locale 'pt' lida com pontos e vírgulas.
    return this.currencyPipe.transform(value, 'BRL', '', '1.2-2', 'pt') || '';
  }
}
