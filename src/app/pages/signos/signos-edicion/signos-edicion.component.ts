import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { Paciente } from 'src/app/_model/paciente';
import { Signos } from 'src/app/_model/signos';
import { map } from 'rxjs/operators';
import { PacienteService } from 'src/app/_service/paciente.service';
import { SignosService } from 'src/app/_service/signos.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-signos-edicion',
  templateUrl: './signos-edicion.component.html',
  styleUrls: ['./signos-edicion.component.css']
})
export class SignosEdicionComponent implements OnInit {

  form: FormGroup;
  pacientes: Paciente[];
  myControlPaciente: FormControl = new FormControl();

  pacientesFiltrados$: Observable<Paciente[]>;
  edicion: boolean = false;
  id: number;

  temperatura: string;
  pulso: string;
  ritmoRespiratorio: string;
  signos: Signos;
  fechaSeleccionada: Date = new Date();
  maxFecha: Date = new Date();
  constructor(
    private pacienteService: PacienteService,
    private signosService: SignosService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.signos = new Signos();
    this.form = new FormGroup({
      'id': new FormControl(0),
      'paciente': this.myControlPaciente,
      'fecha': new FormControl(new Date()),
      'temperatura': new FormControl(''),
      'pulso': new FormControl(''),
      'ritmoRespiratorio': new FormControl('')
    });

    this.route.params.subscribe((params: Params) => {
      this.id = params['id'];
      this.edicion = params['id'] != null;
      this.initForm();
    });

    this.listarPacientes();

    this.pacientesFiltrados$ = this.myControlPaciente.valueChanges.pipe(map(val => this.filtrarPacientes(val)));
  }

  initForm() {
   if (this.edicion) {
      this.signosService.listarPorId(this.id).subscribe(data => {
        this.listarPacientes();
        this.pacientesFiltrados$ = this.myControlPaciente.valueChanges.pipe(map(val => this.filtrarPacientes(data.paciente)));

        let id = data.idSignos;
        let idPaciente = data.paciente.idPaciente;
        let temperatura = data.temperatura;
        let pulso = data.pulso;
        let ritmoRespiratorio = data.ritmoRespiratorio;
        this.form = new FormGroup({
          'id': new FormControl(id),
          'paciente': new FormControl(data.paciente),
          'fecha': new FormControl(data.fecha),
          'temperatura': new FormControl(temperatura),
          'pulso': new FormControl(pulso),
          'ritmoRespiratorio': new FormControl(ritmoRespiratorio)
        });
      });
     
    }
  }

  listarPacientes() {
    this.pacienteService.listar().subscribe(data => {
      this.pacientes = data;
    });
  }

  aceptar() {
    this.signos.idSignos = this.form.value['id'];
    this.signos.paciente = this.form.value['paciente'];
    this.signos.fecha = this.form.value['fecha'];
    this.signos.temperatura = this.form.value['temperatura'];
    this.signos.pulso = this.form.value['pulso'];
    this.signos.ritmoRespiratorio = this.form.value['ritmoRespiratorio'];


    if (this.signos != null && this.signos.idSignos > 0) {
      //BUENA PRACTICA
      this.signosService.modificar(this.signos).pipe(switchMap(() => {
        return this.signosService.listar();
      })).subscribe(data => {
        this.signosService.setSignosCambio(data);
        this.signosService.setMensajeCambio("Se modificó");
      });

    } else {
      //PRACTICA COMUN
      this.signosService.registrar(this.signos).subscribe(data => {
        this.signosService.listar().subscribe(especialidad => {
          this.signosService.setSignosCambio(especialidad);
          this.signosService.setMensajeCambio("Se registró");
        });
      });
    }

    this.router.navigate(['/pages/signos']);
  }

  mostrarPaciente(val: Paciente) {
    return val ? `${val.nombres} ${val.apellidos}` : val;
  }

  filtrarPacientes(val: any) {
    console.log(val);
    if (val != null && val.idPaciente > 0) {
      return this.pacientes.filter(el =>
        el.nombres.toLowerCase().includes(val.nombres.toLowerCase()) || el.apellidos.toLowerCase().includes(val.apellidos.toLowerCase()) || el.dni.includes(val.dni)
      );
    }
    return this.pacientes.filter(el =>
      el.nombres.toLowerCase().includes(val?.toLowerCase()) || el.apellidos.toLowerCase().includes(val?.toLowerCase()) || el.dni.includes(val)
    );
  }
}
