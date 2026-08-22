import { Controller, Get, Post, Patch, Body, Param, Query, Header } from '@nestjs/common';
import { HrService } from './hr.service';

@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('overview')
  async getHROverview() {
    return this.hrService.getHROverview();
  }

  @Get('jobs')
  async getJobs(
    @Query('department') department?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.getJobs({ department, status });
  }

  @Post('jobs')
  async createJob(@Body() jobData: any) {
    return this.hrService.createJob(jobData);
  }

  @Get('applicants')
  async getApplicants(@Query('jobId') jobId?: string) {
    return this.hrService.getApplicants(jobId);
  }

  @Post('applicants')
  async createApplicant(@Body() applicantData: any) {
    return this.hrService.createApplicant(applicantData);
  }

  @Patch('applicants/:id/stage')
  async updateApplicantStage(
    @Param('id') id: string,
    @Body() body: { stage: string; offeredSalary?: string; proposedJoiningDate?: string },
  ) {
    return this.hrService.updateApplicantStage(id, body.stage, body);
  }

  @Post('applicants/:id/scorecard')
  async submitScorecard(
    @Param('id') id: string,
    @Body() scorecardData: any,
  ) {
    return this.hrService.submitInterviewScorecard(id, scorecardData);
  }

  @Get('employees')
  async getEmployees() {
    return this.hrService.getEmployees();
  }

  @Get('employees/:id')
  async getEmployeeById(@Param('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Post('service-book/:employeeId')
  async updateServiceBook(
    @Param('employeeId') employeeId: string,
    @Body() serviceBookUpdate: any,
  ) {
    return this.hrService.updateServiceBook(employeeId, serviceBookUpdate);
  }

  @Post('service-book/:employeeId/increment')
  async addScaleIncrement(
    @Param('employeeId') employeeId: string,
    @Body() incrementData: any,
  ) {
    return this.hrService.addScaleIncrement(employeeId, incrementData);
  }

  @Get('service-book/:employeeId/pdf')
  @Header('Content-Type', 'application/json')
  async getServiceBookPdfMeta(@Param('employeeId') employeeId: string) {
    const employee = await this.hrService.getEmployeeById(employeeId);
    return {
      title: `Form Service Book - ${employee.fullName} (${employee.employeeCode})`,
      institution: 'Delhi Vidya Niketan Senior Secondary School',
      affiliation: 'CBSE Affiliation No: 2730198',
      employee,
      generatedAt: new Date().toISOString(),
      authorizedSignatory: 'Dr. Shalini Verma (Principal)',
      sealStatus: 'digitally_stamped',
    };
  }

  @Patch('police-verification/:employeeId')
  async updatePoliceVerification(
    @Param('employeeId') employeeId: string,
    @Body() data: any,
  ) {
    return this.hrService.updatePoliceVerification(employeeId, data);
  }

  @Get('training-records')
  async getTrainingRecords(@Query('employeeId') employeeId?: string) {
    return this.hrService.getTrainingRecords(employeeId);
  }

  @Post('training-records')
  async addTrainingRecord(@Body() trainingData: any) {
    return this.hrService.addTrainingRecord(trainingData);
  }
}
