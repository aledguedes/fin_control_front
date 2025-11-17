import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { InstallmentPlan } from '../../models/transaction.model';

type FilterStatus = 'todos' | 'ativo' | 'atrasado' | 'concluído';

@Component({
  selector: 'app-installments',
  templateUrl: './installments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class InstallmentsComponent {
  
  filterStatus = signal<FilterStatus>('ativo');

  constructor(public dataService: DataService) {}
  
  filteredPlans = computed(() => {
    const plans = this.dataService.getAllInstallmentPlans();
    const filter = this.filterStatus();

    if (filter === 'todos') {
      return plans;
    }
    return plans.filter(p => p.status === filter);
  });

  setFilter(status: FilterStatus): void {
    this.filterStatus.set(status);
  }

  getProgressBarWidth(plan: InstallmentPlan): string {
    if (plan.totalInstallments === 0) return '0%';
    const percentage = (plan.paidInstallments / plan.totalInstallments) * 100;
    return `${percentage}%`;
  }
}
