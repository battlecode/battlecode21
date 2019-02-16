#include <Python.h>

#if defined(_WIN32)
	#include <windows.h>
#else
	#include <pthread.h>
#endif

// Forked from munawarb/Python-Kill-Thread-Extension

static PyObject* threader_killThread(PyObject*, PyObject*);
static PyObject* threader_killThread(PyObject* self, PyObject* arg) {
	unsigned long id = 0;
	if (!PyArg_ParseTuple(arg, "k", &id)) return NULL;

#if defined(_WIN32)
	int succeeded = TerminateThread(id, 0);
#else
	int succeeded = pthread_cancel(id);
#endif

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