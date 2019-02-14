#include <Python.h>
#include <pthread.h>

// Forked from munawarb/Python-Kill-Thread-Extension

static PyObject* threader_killThread(PyObject*, PyObject*);
static PyObject* threader_enableCancel(PyObject*, PyObject*);
static PyObject* threader_killThread(PyObject* self, PyObject* arg) {
	unsigned long id = 0;
	if (!PyArg_ParseTuple(arg, "k", &id)) return NULL;
	int succeeded = pthread_cancel(id);
	return Py_BuildValue("i", succeeded);
}


static PyMethodDef ThreaderMethods[] = {
	{"killThread",  threader_killThread, METH_VARARGS, "Cancel a thread."},
	{NULL, NULL, 0, NULL}        
};

static struct PyModuleDef threadermodule = {
	PyModuleDef_HEAD_INIT, "threader", NULL, -1, ThreaderMethods
};

PyMODINIT_FUNC PyInit_threader(void) {
	return PyModule_Create(&threadermodule);
}